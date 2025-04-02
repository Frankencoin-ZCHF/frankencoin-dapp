import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, NATIVE_POOL_SHARE_TOKEN_SYMBOL, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownLong } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, DecentralizedEUROABI, EquityABI, FrontendGatewayABI } from "@deuro/eurocoin";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { useTranslation } from "next-i18next";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { InputTitle } from "@components/Input/InputTitle";
import { MaxButton } from "@components/Input/MaxButton";
import { TokenBalance } from "../../hooks/useWalletBalances";
import { TokenInteractionSide } from "./EquityInteractionCard";
interface Props {
	openSelector: (tokenInteractionSide: TokenInteractionSide) => void;	
	selectedFromToken: TokenBalance;
	selectedToToken: TokenBalance;
	refetchBalances: () => void;
	reverseSelection: () => void;
}

export default function InteractionStablecoinAndNativePS({ openSelector, selectedFromToken, selectedToToken, refetchBalances, reverseSelection }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isInversting, setInversting] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const { t } = useTranslation();
	const { frontendCode } = useFrontendCode();
	const { address } = useAccount();
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const account = address || zeroAddress;
	const direction: boolean = selectedFromToken.symbol === TOKEN_SYMBOL;

	const { data: frontendDeuroAllowanceData, refetch: refetchFrontendDeuroAllowance } = useReadContract({
		address: ADDRESS[chainId].decentralizedEURO,
		abi: DecentralizedEUROABI,
		functionName: "allowance",
		args: [account, ADDRESS[chainId].frontendGateway],
	});
	const frontendDeuroAllowance = frontendDeuroAllowanceData ? BigInt(String(frontendDeuroAllowanceData)) : 0n;

	const { data: frontendEquityAllowanceData, refetch: refetchFrontendEquityAllowance } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "allowance",
		args: [account, ADDRESS[chainId].frontendGateway],
	});
	const frontendEquityAllowance = frontendEquityAllowanceData ? BigInt(String(frontendEquityAllowanceData)) : 0n;

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [selectedFromToken.symbol]);

	const handleApproveInvest = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].decentralizedEURO,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].frontendGateway, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].equity),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			await poolStats.refetchPoolStats();
			await refetchFrontendDeuroAllowance();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleInvest = async () => {
		try {
			const investWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "invest",
				args: [amount, result, frontendCode],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount, 18) + " " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.shares"),
					value: formatBigInt(result) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: investWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: investWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("equity.txs.investing", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("equity.txs.successfully_invested", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			await poolStats.refetchPoolStats();
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setInversting(false);
		}
	};

	const { data: nativePSResult, isLoading: shareLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateShares",
		args: [amount],
	});

	const { data: deuroResult, isLoading: proceedLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateProceeds",
		args: [amount],
	});

	const fromBalance = direction ? poolStats.deuroBalance : poolStats.equityBalance;
	const result = (direction ? nativePSResult : deuroResult) || 0n;
	const fromSymbol = direction ? TOKEN_SYMBOL : NATIVE_POOL_SHARE_TOKEN_SYMBOL;
	const unlocked =
		poolStats.equityUserVotes > 86_400 * 90 && poolStats.equityUserVotes < 86_400 * 365 * 30 && poolStats.equityUserVotes > 0n;
	const redeemLeft = 86400n * 90n - (poolStats.equityBalance ? poolStats.equityUserVotes / poolStats.equityBalance / 2n ** 20n : 0n);

	const collateralEurValue = formatBigInt(deuroResult);

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fromBalance) {
			setError(t("common.error.insufficient_balance", { symbol: fromSymbol }));
		} else {
			setError("");
		}
	};

	const handleApproveRedeem = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "approve",
				args: [ADDRESS[chainId].frontendGateway, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].frontendGateway),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			await poolStats.refetchPoolStats();
			await refetchFrontendEquityAllowance();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleRedeem = async () => {
		if (!deuroResult) return;

		try {
			setRedeeming(true);
			const redeemWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "redeem",
				args: [account, amount, deuroResult, frontendCode],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.receive"),
					value: formatBigInt(result) + " " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: redeemWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: redeemWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("equity.txs.redeeming", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: (
						<TxToast
							title={t("equity.txs.successfully_redeemed", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })}
							rows={toastContent}
						/>
					),
				},
			});

			await poolStats.refetchPoolStats();
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setAmount(0n);
			setRedeeming(false);
		}
	};
	
	return (
		<div className="flex flex-col">
			<div className="">
				<InputTitle>{t("common.send")}</InputTitle>
				<TokenInputSelectOutlined
					selectedToken={selectedFromToken}
					onSelectTokenClick={() => openSelector(TokenInteractionSide.INPUT)}
					value={amount.toString()}
					onChange={onChangeAmount}
					isError={Boolean(error)}
					errorMessage={error}
					adornamentRow={
						<div className="self-stretch justify-start items-center inline-flex">
							<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
								<div className="text-text-muted3 text-xs font-medium leading-none">€{collateralEurValue}</div>
								{/**
								 * 
								 // TODO: make available when USD price is available from the backend
								 <div className="h-4 w-0.5 border-l border-input-placeholder"></div>
								 <div className="text-text-muted3 text-xs font-medium leading-none">${collateralUsdValue}</div>
								 */}
							</div>
							<div className="h-7 justify-end items-center gap-2.5 flex">
								{selectedFromToken && (
									<>
										<div className="text-text-muted3 text-xs font-medium leading-none">
											{t("common.balance_label")} {": "}
											{formatUnits(selectedFromToken.balanceOf || 0n, selectedFromToken.decimals || 18)} {selectedFromToken.symbol}
										</div>
										<MaxButton
											disabled={BigInt(selectedFromToken.balanceOf || 0n) === BigInt(0)}
											onClick={() => onChangeAmount(selectedFromToken?.balanceOf?.toString() || "0")}
										/>
									</>
								)}
							</div>
						</div>
					}
				/>

				<div className="pt-2 text-center z-0">
					<Button
						className={`h-10 rounded-full mt-4 !p-2.5`}
						width="w-10"
						onClick={reverseSelection}
					>
						<span className="flex items-center justify-center flex-1">
							<FontAwesomeIcon icon={faArrowDownLong} className="w-5 h-5" />
						</span>
					</Button>
				</div>

				<InputTitle>{t("common.receive")}</InputTitle>
				<TokenInputSelectOutlined
					notEditable
					selectedToken={selectedToToken}
					onSelectTokenClick={() => openSelector(TokenInteractionSide.OUTPUT)}
					value={result.toString()}
					onChange={()=>{}}
					adornamentRow={
						<div className="self-stretch justify-start items-center inline-flex">
							<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
								<div className="text-text-muted2 text-xs font-medium leading-none">€{collateralEurValue}</div>
								{/**
								 * 
								 // TODO: make available when USD price is available from the backend
								 <div className="h-4 w-0.5 border-l border-input-placeholder"></div>
								 <div className="text-text-muted2 text-xs font-medium leading-none">${collateralUsdValue}</div>
								 */}
							</div>
							<div className="h-7 justify-end items-center gap-2.5 flex">
								{selectedToToken && (
									<>
										<div className="text-text-muted2 text-xs font-medium leading-none">
											{formatUnits(selectedToToken.balanceOf || 0n, selectedToToken.decimals || 18)}{" "}
											{selectedToToken.symbol}
										</div>
										<MaxButton
											disabled={BigInt(selectedToToken.balanceOf || 0n) === BigInt(0)}
											onClick={() => onChangeAmount(selectedToToken?.balanceOf?.toString() || "0")}
										/>
									</>
								)}
							</div>
						</div>
					}
				/>

				<div className="my-12 max-w-full flex-col">
					<GuardToAllowedChainBtn label={direction ? t("equity.mint") : t("equity.redeem")}>
						{direction ? (
							amount > frontendDeuroAllowance ? (
								<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApproveInvest()}>
									{t("common.approve")}
								</Button>
							) : (
								<Button disabled={amount == 0n || !!error} isLoading={isInversting} onClick={() => handleInvest()}>
									{t("equity.mint")}
								</Button>
							)
						) : amount > frontendEquityAllowance ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApproveRedeem()}>
								{t("common.approve")}
							</Button>
						) : (
							<Button
								isLoading={isRedeeming}
								disabled={amount == 0n || !!error || !poolStats.equityCanRedeem || !nativePSResult}
								onClick={() => handleRedeem()}
							>
								{t("equity.redeem")}
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="border-t border-borders-dividerLight grid grid-cols-1 md:grid-cols-2 gap-2">
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">{t("equity.holding_duration")}</div>
					<div className="text-base font-medium leading-tight">
						{poolStats.equityBalance > 0 ? formatDuration(poolStats.equityHoldingDuration) : "--"}
					</div>
				</div>
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">{t("equity.can_redeem_after_symbol")}</div>
					<div className="text-base font-medium leading-tight">
						{formatDuration(redeemLeft)}
					</div>
				</div>
			</div>
		</div>
	);
}
