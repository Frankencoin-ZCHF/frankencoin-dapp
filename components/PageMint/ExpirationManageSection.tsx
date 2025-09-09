import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { DetailsExpandablePanel } from "@components/PageMint/DetailsExpandablePanel";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import { renderErrorTxToast } from "@components/TxToast";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ADDRESS, PositionRollerABI, PositionV2ABI } from "@deuro/eurocoin";
import { useRouter } from "next/router";
import { writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useChainId, useReadContracts } from "wagmi";
import { Address } from "viem/accounts";
import { getCarryOnQueryParams, shortenAddress, toDate, toQueryString, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import Button from "@components/Button";
import { erc20Abi, maxUint256 } from "viem";
import Link from "next/link";
import { useContractUrl } from "../../hooks/useContractUrl";
import { getLoanDetailsByCollateralAndLiqPrice } from "../../utils/loanCalculations";

export const ExpirationManageSection = () => {
	const [expirationDate, setExpirationDate] = useState<Date | undefined | null>(undefined);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	const { t } = useTranslation();
	const chainId = useChainId();

	const router = useRouter();
	const { address: positionAddress } = router.query;

	const positions = useSelector((state: RootState) => state.positions.list?.list || []);
	const position = positions.find((p) => p.position == positionAddress);
	const prices = useSelector((state: RootState) => state.prices.coingecko || {});

	const challenges = useSelector((state: RootState) => state.challenges.list?.list || []);
	const challengedPositions = challenges.filter((c) => c.status === "Active").map((c) => c.position);

	const [targetPosition] = useMemo(() => {
		if (!position) return [];
		const now = new Date().getTime() / 1000;
		return positions
			.filter((p) => p.collateral.toLowerCase() === position.collateral.toLowerCase())
			.filter((p) => !challengedPositions.includes(p.position))
			.filter((p) => now > toTimestamp(toDate(p.cooldown)))
			.filter((p) => now < toTimestamp(toDate(p.expiration)))
			.filter((p) => !p.closed)
			.filter((p) => toTimestamp(toDate(p.expiration)) > toTimestamp(toDate(position.expiration)))
			.filter((p) => BigInt(p.availableForClones) > 0n)
			.filter((p) => BigInt(p.availableForMinting) > 0n)
			.sort((a, b) => toTimestamp(toDate(a.expiration)) - toTimestamp(toDate(b.expiration)));
	}, [positions, challengedPositions, position]);

	const { balancesByAddress, refetchBalances } = useWalletERC20Balances(
		position ? [
			{
				symbol: position.collateralSymbol,
				address: position.collateral,
				name: position.collateralSymbol,
				allowance: [ADDRESS[chainId].roller],
			},
			{
				symbol: position.deuroSymbol,
				address: position.deuro,
				name: position.deuroSymbol,
				allowance: [ADDRESS[chainId].roller],
			},
		] : []
	);

	const collateralAllowance = position ? balancesByAddress[position.collateral]?.allowance?.[ADDRESS[chainId].roller] : undefined;
	const deuroAllowance = position ? balancesByAddress[position.deuro]?.allowance?.[ADDRESS[chainId].roller] : undefined;
	const deuroBalance = position ? balancesByAddress[position.deuro]?.balanceOf : 0n;

	const url = useContractUrl(position?.position || "");
	
	// Fetch principal and debt from smart contract
	const { data: contractData } = useReadContracts({
		contracts: position ? [
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "principal",
			},
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "getDebt",
			},
		] : [],
	});
	
	const principal = contractData?.[0]?.result || 0n;
	const currentDebt = contractData?.[1]?.result || 0n;

	useEffect(() => {
		if (position) {
			if (targetPosition?.expiration) {
				setExpirationDate((date) => date ?? new Date(targetPosition.expiration * 1000));
			} else {
				setExpirationDate((date) => date ?? new Date(position.expiration * 1000));
			}
		}
	}, [position, targetPosition]);

	if (!position) {
		return (
			<div className="flex justify-center items-center h-64">
				<span className="text-text-muted2">Loading position data...</span>
			</div>
		);
	}

	const handleExtendExpiration = async () => {
		try {
			setIsTxOnGoing(true);

			const extendingHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].roller,
				abi: PositionRollerABI,
				functionName: "rollFullyWithExpiration",
				args: [positionAddress as Address, targetPosition?.position as Address, toTimestamp(expirationDate as Date)],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: extendingHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: extendingHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.extending")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.extending_success")} rows={toastContent} />,
				},
			});

			const carryOnQueryParams = getCarryOnQueryParams(router);
			const _href = `/dashboard${toQueryString(carryOnQueryParams)}`;
			router.push(_href);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const handleApproveCollateral = async () => {
		try {
			setIsTxOnGoing(true);

			const approvingHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].roller, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: approvingHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approvingHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: position.collateralSymbol })} rows={toastContent} />,
				},
			});

			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const handleApproveDeuro = async () => {
		try {
			setIsTxOnGoing(true);

			const approvingHash = await writeContract(WAGMI_CONFIG, {
				address: position.deuro,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].roller, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: approvingHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approvingHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: position.deuroSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: position.deuroSymbol })} rows={toastContent} />,
				},
			});

			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const collateralPrice = prices?.[position.collateral.toLowerCase() as Address]?.price?.usd || 0;
	const loanDetails = getLoanDetailsByCollateralAndLiqPrice(position, BigInt(position?.collateralBalance), BigInt(position.price));

	const currentExpirationDate = position ? new Date(position.expiration * 1000) : new Date();
	const daysUntilExpiration = Math.ceil((currentExpirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	
	// Calculate interest amount to be paid using smart contract data
	const interest = currentDebt > principal ? currentDebt - principal : 0n;
	
	// Check if user has enough dEURO balance to pay interest
	const hasInsufficientBalance = interest > 0n && BigInt(deuroBalance || 0) < interest;
	
	// Format number with commas
	const formatNumber = (value: bigint, decimals: number = 18): string => {
		const num = Number(value) / Math.pow(10, decimals);
		return new Intl.NumberFormat('en-US', { 
			minimumFractionDigits: 2, 
			maximumFractionDigits: 2 
		}).format(num);
	};

	return (
		<div className="flex flex-col gap-y-8">
			<div className="flex flex-col gap-y-1.5">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.current_expiration_date")}</div>
				<div className="text-base font-medium">
					{currentExpirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
					{' - '}
					{daysUntilExpiration > 0 
						? `${daysUntilExpiration} days until expiration`
						: daysUntilExpiration === 0 
						? 'Expires today'
						: `Expired ${Math.abs(daysUntilExpiration)} days ago`}
				</div>
				<div className="text-xs font-medium">
					{t("mint.extend_roll_borrowing_description")}
				</div>
			</div>
			<div className="flex flex-col gap-y-1.5">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.newly_selected_expiration_date")}</div>
				<DateInputOutlined
					maxDate={targetPosition?.expiration ? new Date(targetPosition.expiration * 1000) : undefined}
					value={expirationDate}
					placeholderText={new Date(position.expiration * 1000).toISOString().split("T")[0]}
					className="placeholder:text-[#5D647B]"
					onChange={setExpirationDate}
					rightAdornment={
						<MaxButton
							className="h-full py-3.5 px-3"
							onClick={() => setExpirationDate(targetPosition?.expiration ? new Date(targetPosition.expiration * 1000) : undefined)}
							disabled={!targetPosition}
							label={t("common.max")}
						/>
					}
				/>
			</div>
			{!collateralAllowance ? (
				<Button
					className="text-lg leading-snug !font-extrabold"
					onClick={handleApproveCollateral}
					isLoading={isTxOnGoing}
					disabled={isTxOnGoing}
				>
					{t("common.approve")} {position.collateralSymbol}
				</Button>
			) : !deuroAllowance ? (
				<Button
					className="text-lg leading-snug !font-extrabold"
					onClick={handleApproveDeuro}
					isLoading={isTxOnGoing}
					disabled={isTxOnGoing}
				>
					{t("common.approve")} {position.deuroSymbol}
				</Button>
			) : (
				<>
					{targetPosition && expirationDate && expirationDate.getTime() > currentExpirationDate.getTime() && (
						<div className="text-sm font-medium text-center mb-4">
							Extending by {Math.ceil((expirationDate.getTime() - currentExpirationDate.getTime()) / (1000 * 60 * 60 * 24))} days
						</div>
					)}
					{interest > 0n && (
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Outstanding Interest to Pay:
								</span>
								<span className="text-lg font-bold text-gray-900 dark:text-gray-100">
									{formatNumber(interest)} {position.deuroSymbol}
								</span>
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
								Current debt: {formatNumber(currentDebt)} {position.deuroSymbol} 
								{' '}(Original: {formatNumber(principal)} {position.deuroSymbol})
							</div>
							{hasInsufficientBalance && (
								<div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
									<div className="text-xs font-medium text-red-600 dark:text-red-400">
										Insufficient {position.deuroSymbol} balance
									</div>
									<div className="text-xs text-red-500 dark:text-red-500 mt-1">
										You have: {formatNumber(BigInt(deuroBalance || 0))} {position.deuroSymbol}
										<br />
										You need: {formatNumber(interest)} {position.deuroSymbol}
									</div>
								</div>
							)}
						</div>
					)}
					<Button
						className="text-lg leading-snug !font-extrabold"
						onClick={handleExtendExpiration}
						isLoading={isTxOnGoing}
						disabled={isTxOnGoing || !targetPosition || !expirationDate || expirationDate.getTime() <= currentExpirationDate.getTime() || hasInsufficientBalance}
					>
						{t("mint.extend_roll_borrowing")}
					</Button>
				</>
			)}

			<DetailsExpandablePanel
				loanDetails={loanDetails}
				collateralPriceDeuro={collateralPrice}
				collateralDecimals={position.collateralDecimals}
				startingLiquidationPrice={BigInt(position.price)}
				extraRows={
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("common.position")}</span>
						<Link
							className="underline text-right text-sm font-extrabold leading-none tracking-tight"
							href={url}
							target="_blank"
						>
							{shortenAddress(position.position)}
						</Link>
					</div>
				}
			/>
		</div>
	);
};
