import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatBigInt, formatCurrency, formatDuration, NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL, shortenAddress } from "@utils";
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
import { ADDRESS, EquityABI, DEPSWrapperABI } from "@deuro/eurocoin";
import { useTranslation } from "next-i18next";
import { TokenBalance } from "../../hooks/useWalletBalances";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { InputTitle } from "@components/Input/InputTitle";
import { TokenInteractionSide } from "./EquityInteractionCard";
interface Props {
	openSelector: (tokenInteractionSide: TokenInteractionSide) => void;
	selectedFromToken: TokenBalance;
	selectedToToken: TokenBalance;
	refetchBalances: () => void;
	reverseSelection: () => void;
}

export default function InteractionNativePSAndPoolShareToken({
	openSelector,
	selectedFromToken,
	selectedToToken,
	refetchBalances,
	reverseSelection,
}: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isWrapping, setWrapping] = useState(false);
	const [isUnwrapping, setUnwrapping] = useState(false);
	const [nativePSAllowance, setNativePSAllowance] = useState<bigint>(0n);
	const [nativePSBalance, setNativePSBalance] = useState<bigint>(0n);
	const [nativePSHolding, setNativePSHolding] = useState<bigint>(0n);
	const [psTokenBalance, setPsTokenBalance] = useState<bigint>(0n);
	const [psTokenHolding, setPsTokenHolding] = useState<bigint>(0n);
	const { t } = useTranslation();
	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const chainId = useChainId();
	const account = address || zeroAddress;
	const direction: boolean = selectedFromToken.symbol === NATIVE_POOL_SHARE_TOKEN_SYMBOL;

	const { data: collateralEurValue = 0n } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateProceeds",
		args: [amount],
	});

	useEffect(() => {
		setError("");
	}, [selectedFromToken.symbol]);

	useEffect(() => {
		const fetchAsync = async function () {
			if (account != zeroAddress) {
				const _nativePSAllowance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: erc20Abi,
					functionName: "allowance",
					args: [account, ADDRESS[chainId].DEPSwrapper],
				});
				setNativePSAllowance(_nativePSAllowance);

				const _nativePSBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [account],
				});
				setNativePSBalance(_nativePSBalance);

				const _nativePSHolding = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: EquityABI,
					functionName: "holdingDuration",
					args: [account],
				});
				setNativePSHolding(_nativePSHolding);

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
	}, [data, account, chainId, isApproving]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].DEPSwrapper, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].DEPSwrapper),
				},
				{
					title: t("common.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
			setNativePSAllowance(amount);
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setApproving(false);
		}
	};

	const handleWrapping = async () => {
		try {
			setWrapping(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].DEPSwrapper,
				abi: DEPSWrapperABI,
				functionName: "depositFor",
				args: [account, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.receive"),
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("equity.txs.wrapping", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: (
						<TxToast title={t("equity.txs.success_wrapping", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />
					),
				},
			});
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setAmount(0n);
			setWrapping(false);
		}
	};
	const handleUnwrapping = async () => {
		try {
			setUnwrapping(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].DEPSwrapper,
				abi: DEPSWrapperABI,
				functionName: "withdrawTo",
				args: [account, amount],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.receive"),
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("equity.txs.unwrapping", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("equity.txs.success_unwrapping", { symbol: POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setAmount(0n);
			setUnwrapping(false);
		}
	};

	const fromBalance = direction ? nativePSBalance : psTokenBalance;
	const fromSymbol = direction ? NATIVE_POOL_SHARE_TOKEN_SYMBOL : POOL_SHARE_TOKEN_SYMBOL;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fromBalance) {
			setError(t("common.error.insufficient_balance", { symbol: fromSymbol }));
		} else {
			setError("");
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
								<div className="text-text-muted3 text-xs font-medium leading-none">€{formatCurrency(formatUnits(collateralEurValue, 18))}</div>
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
											{formatUnits(selectedFromToken.balanceOf || 0n, selectedFromToken.decimals || 18)}{" "}
											{selectedFromToken.symbol}
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
					value={amount.toString()}
					onChange={() => {}}
					adornamentRow={
						<div className="self-stretch justify-start items-center inline-flex">
							<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
							<div className="text-text-muted3 text-xs font-medium leading-none">€{formatCurrency(formatUnits(collateralEurValue, 18))}</div>
								{/**
								 * 
								 // TODO: make available when USD price is available from the backend
								 <div className="h-4 w-0.5 border-l border-input-placeholder"></div>
								 <div className="text-text-muted3 text-xs font-medium leading-none">${collateralUsdValue}</div>
								 */}
							</div>
							<div className="h-7 justify-end items-center gap-2.5 flex">
								{selectedToToken && (
									<>
										<div className="text-text-muted3 text-xs font-medium leading-none">
											{t("common.balance_label")} {": "}
											{formatUnits(selectedToToken.balanceOf || 0n, selectedToToken.decimals || 18)}{" "}
											{selectedFromToken.symbol}
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
					<GuardToAllowedChainBtn label={direction ? t("equity.wrap") : t("equity.unwrap")}>
						{direction ? (
							amount > nativePSAllowance ? (
								<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									{t("common.approve")}
								</Button>
							) : (
								<Button disabled={amount == 0n || !!error} isLoading={isWrapping} onClick={() => handleWrapping()}>
									{t("equity.wrap")}
								</Button>
							)
						) : (
							<Button isLoading={isUnwrapping} disabled={amount == 0n || !!error} onClick={() => handleUnwrapping()}>
								{t("equity.unwrap")}
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="border-t border-borders-dividerLight grid grid-cols-1 md:grid-cols-2 gap-2">
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">
						{t("equity.holding_duration_symbol", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })}
					</div>
					<div className="text-base font-medium leading-tight">
						{nativePSHolding > 0 && nativePSHolding < 86_400 * 365 * 10 ? formatDuration(nativePSHolding) : "--"}
					</div>
				</div>
				<div className="flex flex-col gap-2 p-4">
					<div className="text-text-muted2 text-base font-medium leading-tight">
						{t("equity.holding_duration_symbol", { symbol: POOL_SHARE_TOKEN_SYMBOL })}
					</div>
					<div className="text-base font-medium leading-tight">
						{psTokenHolding > 0 && psTokenHolding < 86_400 * 365 * 10 ? formatDuration(psTokenHolding) : "--"}
					</div>
				</div>
			</div>
		</div>
	);
}
