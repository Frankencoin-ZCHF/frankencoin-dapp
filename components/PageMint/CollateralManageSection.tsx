import { useEffect, useState } from "react";
import TokenLogo from "@components/TokenLogo";
import { NormalInputOutlined } from "@components/Input/NormalInputOutlined";
import Button from "@components/Button";
import { AddCircleOutlineIcon } from "@components/SvgComponents/add_circle_outline";
import { RemoveCircleOutlineIcon } from "@components/SvgComponents/remove_circle_outline";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { RootState, store } from "../../redux/redux.store";
import { PositionQuery } from "@deuro/api";
import { useSelector } from "react-redux";
import { Address, erc20Abi, formatUnits, maxUint256 } from "viem";
import { formatBigInt, formatCurrency, shortenAddress } from "@utils";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { useChainId, useReadContracts } from "wagmi";
import { writeContract } from "wagmi/actions";
import { PositionV2ABI } from "@deuro/eurocoin";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { waitForTransactionReceipt } from "wagmi/actions";
import { renderErrorTxToast } from "@components/TxToast";
import { TxToast } from "@components/TxToast";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { DetailsExpandablePanel } from "@components/DetailsExpandablePanel";

export const CollateralManageSection = () => {
	const router = useRouter();
	const [amount, setAmount] = useState("");
	const [isAdd, setIsAdd] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	const { t } = useTranslation();
	const chainId = useChainId();

	const { address: addressQuery } = router.query;
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const { balancesByAddress, refetchBalances } = useWalletERC20Balances([
		{
			symbol: position.collateralSymbol,
			address: position.collateral,
			name: position.collateralName,
			allowance: [position.position],
		},
	]);

	const { data, refetch: refetchReadContracts } = useReadContracts({
		contracts: [
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
				functionName: "price",
			},
			{
				chainId,
				abi: erc20Abi,
				address: position.collateral as Address,
				functionName: "balanceOf",
				args: [position.position],
			},
			{
				chainId,
				abi: PositionV2ABI,
				address: position.position,
				functionName: "getDebt",
			},
		],
	});

	
	if (!position) return null;

	const principal = data?.[0]?.result || BigInt(position.principal);
	const price = data?.[1]?.result || BigInt(position.price);
	const balanceOf = data?.[2]?.result || BigInt(position.collateralBalance); // collateral reserve
	const debt = data?.[3]?.result || 0n;
	const collateralPrice = prices[position.collateralSymbol as Address]?.price?.eur || 1;
	const collateralValuation = collateralPrice * Number(formatUnits(balanceOf, position.collateralDecimals));
	const walletBalance = balancesByAddress[position.collateral as Address]?.balanceOf || 0n;
	const allowance = balancesByAddress[position.collateral as Address]?.allowance?.[position.position] || 0n;
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd || 0;
	const deuroPrice = prices[position.deuro.toLowerCase() as Address]?.price?.usd || 1;
	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceDEURO: number = Math.round(((balance * collTokenPrice) / deuroPrice) * 100) / 100;
	const liquidationDEURO: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationPct: number = Math.round((balanceDEURO / (liquidationDEURO * balance)) * 10000) / 100;
	const maxToRemoveThreshold = balanceOf - (debt * 10n ** BigInt(position.collateralDecimals) / price) - BigInt(position.minimumCollateral);
	const maxToRemove = maxToRemoveThreshold > 0n ? maxToRemoveThreshold : 0n;

	const handleAddMax = () => {
		setAmount(walletBalance.toString());
	};

	const handleRemoveMax = () => {
		setAmount(maxToRemove.toString());
	};

	const handleApprove = async () => {
		try {
			setIsTxOnGoing(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.position, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(position.position),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${t("common.txs.title", { symbol: position.collateralSymbol })}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`${t("common.txs.success", { symbol: position.collateralSymbol })}`} rows={toastContent} />,
				},
			});
			refetchBalances();
			refetchReadContracts();
			store.dispatch(fetchPositionsList());
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: needs to be translated
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const handleAdd = async () => {
		try {
			setIsTxOnGoing(true);

			const contractAmount = BigInt(amount) + balanceOf;

			const addHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV2ABI,
				functionName: "adjust",
				args: [principal, contractAmount, price],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(BigInt(amount)) + ` ${position.collateralSymbol}`,
				},
				{
					title: t("common.txs.transaction"),
					hash: addHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: addHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.adding_collateral")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.adding_collateral_success")} rows={toastContent} />,
				},
			});
			setAmount("");
			refetchBalances();
			refetchReadContracts();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); //
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const handleRemove = async () => {
		try {
			setIsTxOnGoing(true);

			const contractAmount = balanceOf - BigInt(amount);
			const addHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV2ABI,
				functionName: "adjust",
				args: [principal, contractAmount, price],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(BigInt(amount)) + ` ${position.collateralSymbol}`,
				},
				{
					title: t("common.txs.transaction"),
					hash: addHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: addHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.removing_collateral")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.removing_collateral_success")} rows={toastContent} />,
				},
			});
			setAmount("");
			refetchBalances();
			refetchReadContracts();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); //
		} finally {
			setIsTxOnGoing(false);
		}
	};

	// Error validation only for adding collateral
	useEffect(() => {
		if (!isAdd) return;

		if (!amount) {
			setError(null);
		} else if (BigInt(amount) > walletBalance) {
			setError(t("common.error.insufficient_balance", { symbol: position.collateralSymbol }));
		} else {
			setError(null);
		}
	}, [isAdd, amount, balanceOf]);

	// Error validation only for removing collateral
	useEffect(() => {
		if (isAdd) return;

		if (!amount) {
			setError(null);
		} else if (BigInt(amount) > maxToRemove) {
			setError(t("mint.error.amount_greater_than_max_to_remove"));
		} else if (BigInt(amount) > balanceOf) {
			setError(t("mint.error.amount_greater_than_position_balance"));
		} else {
			setError(null);
		}
	}, [isAdd, amount, balanceOf]);

	return (
		<div className="flex flex-col gap-y-8">
			<div className="flex flex-col gap-y-3">
				<div className="flex flex-row justify-between items-center">
					<div className="pl-3 flex flex-row gap-x-2 items-center">
						<TokenLogo currency={position.collateralSymbol} />
						<div className="flex flex-col">
							<span className="text-base font-extrabold leading-tight">
								<span className="">{formatUnits(balanceOf, position.collateralDecimals)}</span>{" "}
								{position.collateralSymbol}
							</span>
							<span className="text-xs font-medium text-text-muted2 leading-[1rem]">
								{formatCurrency(collateralValuation)} dEURO
							</span>
						</div>
					</div>
					<div className="flex flex-row justify-end items-center">
						<button className="px-2 flex flex-row gap-x-1 items-center py-1" onClick={() => setIsAdd(true)}>
							<AddCircleOutlineIcon color={isAdd ? "#065DC1" : "#8B92A8"} />
							<span
								className={`mt-0.5 ${
									isAdd ? "text-button-textGroup-primary-text" : "text-button-textGroup-secondary-text"
								} text-base font-extrabold leading-tight`}
							>
								{t("common.add")}
							</span>
						</button>
						<button className="px-2 flex flex-row gap-x-1 items-center py-1" onClick={() => setIsAdd(false)}>
							<RemoveCircleOutlineIcon color={isAdd ? "#8B92A8" : "#065DC1"} />
							<span
								className={`mt-0.5 ${
									isAdd ? "text-button-textGroup-secondary-text" : "text-button-textGroup-primary-text"
								} text-base font-extrabold leading-tight`}
							>
								{t("common.remove")}
							</span>
						</button>
					</div>
				</div>
				<div className="w-full">
					<NormalInputOutlined
						showTokenLogo={false}
						value={amount}
						onChange={setAmount}
						decimals={position.collateralDecimals}
						unit={position.collateralSymbol}
						isError={Boolean(error)}
						adornamentRow={
							<div className="pl-2 text-xs leading-[1rem] flex flex-row gap-x-2">
								<span className="font-medium text-text-muted3">
									{t(isAdd ? "mint.available_to_add" : "mint.available_to_remove")}:
								</span>
								<button className="text-text-labelButton font-extrabold" onClick={isAdd ? handleAddMax : handleRemoveMax}>
									{formatUnits(isAdd ? walletBalance : maxToRemove, position.collateralDecimals)} {position.collateralSymbol}
								</button>
							</div>
						}
					/>
					{error && <div className="ml-1 text-text-warning text-sm">{error}</div>}
				</div>
				<div className="w-full mt-1.5 px-4 py-2 rounded-xl bg-[#E4F0FC] flex flex-row justify-between items-center text-base font-extrabold text-[#272B38]">
					<span>{t("mint.collateralization")}</span>
					<span>{liquidationPct} %</span>
				</div>
			</div>
			{allowance > BigInt(amount) ? (
				<Button className="text-lg leading-snug !font-extrabold" onClick={isAdd ? handleAdd : handleRemove} isLoading={isTxOnGoing} disabled={Boolean(error) || !Boolean(amount)}>
					{t(isAdd ? "mint.add_collateral" : "mint.remove_collateral")}
				</Button>
			) : (
				<Button className="text-lg leading-snug !font-extrabold" onClick={handleApprove} isLoading={isTxOnGoing}>
					{t("common.approve")}
				</Button>
			)}
			<DetailsExpandablePanel loanDetails={undefined} collateralPriceDeuro={0} />
		</div>
	);
};
