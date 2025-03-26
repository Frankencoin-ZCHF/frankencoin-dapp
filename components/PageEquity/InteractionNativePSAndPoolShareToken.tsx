import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatBigInt, formatDuration, NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL, shortenAddress } from "@utils";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowDown19, faArrowDownLong, faArrowDownUpLock } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { ADDRESS, EquityABI, DEPSWrapperABI } from "@deuro/eurocoin";
import { useTranslation } from "next-i18next";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function InteractionNativePSAndPoolShareToken({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
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
	const direction: boolean = tokenFromTo.from === NATIVE_POOL_SHARE_TOKEN_SYMBOL;

	useEffect(() => {
		setError("");
	}, [tokenFromTo]);

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
					render: <TxToast title={t("equity.txs.success_wrapping", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
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
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setAmount(0n);
			setUnwrapping(false);
		}
	};

	const fromBalance = direction ? nativePSBalance : psTokenBalance;
	const fromSymbol = direction ? NATIVE_POOL_SHARE_TOKEN_SYMBOL : POOL_SHARE_TOKEN_SYMBOL;
	const toSymbol = !direction ? NATIVE_POOL_SHARE_TOKEN_SYMBOL : POOL_SHARE_TOKEN_SYMBOL;

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
		<>
			<div className="mb-4">
				<TokenInputSelect
					max={fromBalance}
					symbol={fromSymbol}
					symbolOptions={Object.keys(selectorMapping) || []}
					symbolOnChange={(o) => setTokenFromTo({ from: o.label, to: selectorMapping[o.label][0] })}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={t("common.symbol_amount", { symbol: fromSymbol })}
				/>

				<div className="py-2 text-center z-0">
					<Button className={`h-10 rounded-full mt-4 !p-2.5`} width="w-10" onClick={() => setTokenFromTo({ from: toSymbol, to: fromSymbol })}>
						<span className="flex items-center justify-center flex-1">
							<FontAwesomeIcon icon={faArrowDownLong} className="w-5 h-5" />
						</span>
					</Button>
				</div>

				<TokenInputSelect
					symbol={toSymbol}
					symbolOptions={selectorMapping[fromSymbol] || []}
					symbolOnChange={(o) => setTokenFromTo({ from: tokenFromTo.from, to: o.label })}
					hideMaxLabel
					output={Math.round(parseFloat(formatUnits(amount, 18)) * 10000) / 10000}
					label={t("common.receive")}
				/>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
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

			<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label={t("equity.your_balance")} />
					<DisplayAmount
						bold
						className="mt-2"
						amount={nativePSBalance}
						currency={NATIVE_POOL_SHARE_TOKEN_SYMBOL}
						address={ADDRESS[chainId].equity}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.holding_duration_symbol", { symbol: NATIVE_POOL_SHARE_TOKEN_SYMBOL })} />
					<div className="mt-2 font-bold">{nativePSHolding > 0 && nativePSHolding < 86_400 * 365 * 10 ? formatDuration(nativePSHolding) : "--"}</div>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.your_balance")} />
					<DisplayAmount
						bold
						className="mt-2"
						amount={psTokenBalance}
						currency={POOL_SHARE_TOKEN_SYMBOL}
						address={ADDRESS[chainId].DEPSwrapper}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.holding_duration_symbol", { symbol: POOL_SHARE_TOKEN_SYMBOL })} />
					<div className="mt-2 font-bold">{psTokenHolding > 0 && psTokenHolding < 86_400 * 365 * 10 ? formatDuration(psTokenHolding) : "--"}</div>
				</AppBox>
			</div>
		</>
	);
}
