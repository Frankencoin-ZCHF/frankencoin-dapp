import React, { useEffect, useState } from "react";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatCurrency, formatDuration, POOL_SHARE_TOKEN_SYMBOL, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { useAccount, useBlockNumber, useChainId, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownLong } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, EquityABI, DEPSWrapperABI, FrontendGatewayABI } from "@deuro/eurocoin";
import { useTranslation } from "next-i18next";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { TokenBalance } from "../../hooks/useWalletBalances";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { InputTitle } from "@components/Input/InputTitle";
import { TokenInteractionSide } from "./EquityInteractionCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
interface Props {
	openSelector: (tokenInteractionSide: TokenInteractionSide) => void;
	selectedFromToken: TokenBalance | undefined;
	selectedToToken: TokenBalance | undefined;
	refetchBalances: () => void;
	reverseSelection: () => void;
}

export default function InteractionPoolShareTokenRedeem({
	openSelector,
	selectedFromToken,
	selectedToToken,
	refetchBalances,
	reverseSelection,
}: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const [psTokenAllowance, setPsTokenAllowance] = useState<bigint>(0n);
	const [psTokenBalance, setPsTokenBalance] = useState<bigint>(0n);
	const [psTokenHolding, setPsTokenHolding] = useState<bigint>(0n);
	const [calculateProceeds, setCalculateProceeds] = useState<bigint>(0n);
	const { frontendCode } = useFrontendCode();

	const { t } = useTranslation();
	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const poolStats = usePoolStats();
	const chainId = useChainId();
	const eurPrice = useSelector((state: RootState) => state.prices.eur?.usd);
	const account = address || zeroAddress;

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [selectedToToken?.symbol, selectedFromToken?.symbol]);

	useEffect(() => {
		const fetchAsync = async function () {
			if (account != zeroAddress) {
				const _psTokenAllowance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].DEPSwrapper,
					abi: erc20Abi,
					functionName: "allowance",
					args: [account, ADDRESS[chainId].frontendGateway],
				});
				setPsTokenAllowance(_psTokenAllowance);

				const _psTokenBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].DEPSwrapper,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [account],
				});
				setPsTokenBalance(_psTokenBalance);
			}

			const _psTokenHolding = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "holdingDuration",
				args: [ADDRESS[chainId].DEPSwrapper],
			});
			setPsTokenHolding(_psTokenHolding);
		};

		fetchAsync();
	}, [data, account, chainId]);

	useEffect(() => {
		const fetchAsync = async function () {
			const _calculateProceeds = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "calculateProceeds",
				args: [amount],
			});
			setCalculateProceeds(_calculateProceeds);
		};

		fetchAsync();
	}, [chainId, amount]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].DEPSwrapper,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].frontendGateway, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].DEPSwrapper),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
			await poolStats.refetchPoolStats();
			setPsTokenAllowance(amount);
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setApproving(false);
		}
	};

	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "unwrapAndSell",
				args: [amount, frontendCode],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.receive"),
					value: formatBigInt(calculateProceeds) + " " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("equity.txs.redeem", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("equity.txs.success_redeem", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
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

	const fromSymbol = POOL_SHARE_TOKEN_SYMBOL;
	const toSymbol = TOKEN_SYMBOL;
	const unlocked = psTokenHolding > 86_400 * 90 && psTokenHolding < 86_400 * 365 * 30;
	const redeemLeft = unlocked ? 0n : 86_400n * 90n - psTokenHolding;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > psTokenBalance) {
			setError(t("common.error.insufficient_balance", { symbol: fromSymbol }));
		} else {
			setError("");
		}
	};

	const usdValue = eurPrice && calculateProceeds ? formatBigInt(BigInt(Math.floor(eurPrice * 10000)) * calculateProceeds / 10000n) : formatBigInt(0n);

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
								<div className="text-text-muted3 text-xs font-medium leading-none">
									€{formatCurrency(formatUnits(calculateProceeds, 18))}
								</div>
								{eurPrice && (
									<>
										<div className="h-4 w-0.5 border-l border-input-placeholder"></div>
										<div className="text-text-muted3 text-xs font-medium leading-none">${formatCurrency(usdValue)}</div>
									</>
								)}
							</div>
							<div className="h-7 justify-end items-center gap-2.5 flex">
								{selectedFromToken && (
									<>
										<div className="text-text-muted3 text-xs font-medium leading-none">
											{t("common.balance_label")} {" "}
											{formatUnits(selectedFromToken?.balanceOf || 0n, selectedFromToken?.decimals || 18)}{" "}
											{selectedFromToken?.symbol}
										</div>
										<MaxButton
											disabled={BigInt(selectedFromToken?.balanceOf || 0n) === BigInt(0)}
											onClick={() => onChangeAmount(selectedFromToken?.balanceOf?.toString() || "0")}
										/>
									</>
								)}
							</div>
						</div>
					}
				/>

				<div className="pt-2 text-center z-0">
					<Button className={`h-10 rounded-full mt-4 !p-2.5`} width="w-10" onClick={reverseSelection}>
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
					value={calculateProceeds.toString()}
					onChange={() => {}}
					adornamentRow={
						<div className="self-stretch justify-start items-center inline-flex">
							<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
								<div className="text-text-muted3 text-xs font-medium leading-none">
									€{formatCurrency(formatUnits(calculateProceeds, 18))}
								</div>
								{eurPrice && (
									<>
										<div className="h-4 w-0.5 border-l border-input-placeholder"></div>
										<div className="text-text-muted3 text-xs font-medium leading-none">${formatCurrency(usdValue)}</div>
									</>
								)}
							</div>
							<div className="h-7 justify-end items-center gap-2.5 flex">
								{selectedToToken && (
									<>
										<div className="text-text-muted3 text-xs font-medium leading-none">
											{t("common.balance_label")} {" "}
											{formatUnits(selectedToToken?.balanceOf || 0n, selectedToToken?.decimals || 18)}{" "}
											{selectedFromToken?.symbol}
										</div>
										<MaxButton
											disabled={BigInt(selectedToToken?.balanceOf || 0n) === BigInt(0)}
											onClick={() => onChangeAmount(selectedToToken?.balanceOf?.toString() || "0")}
										/>
									</>
								)}
							</div>
						</div>
					}
				/>

				<div className="my-12 max-w-full flex-col">
					<GuardToAllowedChainBtn label={t("equity.unwrap_and_redeem")}>
						{amount > psTokenAllowance ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleApprove()}>
								{t("common.approve")}
							</Button>
						) : (
							<Button isLoading={isRedeeming} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleRedeem()}>
								{t("equity.unwrap_and_redeem")}
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>
			<div className="border-t border-borders-dividerLight grid grid-cols-1 md:grid-cols-2 gap-2">
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">
						{t("equity.holding_duration_symbol", { symbol: POOL_SHARE_TOKEN_SYMBOL })}
					</div>
					<div className="text-base font-medium leading-tight">
						{psTokenHolding > 0 && psTokenHolding < 86_400 * 365 * 10 ? formatDuration(psTokenHolding) : "--"}
					</div>
				</div>
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">{t("equity.can_redeem_after_symbol")}</div>
					<div className="text-base font-medium leading-tight">{formatDuration(redeemLeft)}</div>
				</div>
			</div>
		</div>
	);
}
