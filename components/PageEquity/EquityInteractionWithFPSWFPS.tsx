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
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { ADDRESS, EquityABI, DEPSWrapperABI } from "@deuro/eurocoin";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function EquityInteractionWithFPSWFPS({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isWrapping, setWrapping] = useState(false);
	const [isUnwrapping, setUnwrapping] = useState(false);
	const [fpsAllowance, setFpsAllowance] = useState<bigint>(0n);
	const [fpsBalance, setFpsBalance] = useState<bigint>(0n);
	const [wfpsBalance, setWfpsBalance] = useState<bigint>(0n);
	const [fpsHolding, setFpsHolding] = useState<bigint>(0n);
	const [wfpsHolding, setWfpsHolding] = useState<bigint>(0n);

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
				const _fpsAllowance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: erc20Abi,
					functionName: "allowance",
					args: [account, ADDRESS[chainId].DEPSwrapper],
				});
				setFpsAllowance(_fpsAllowance);

				const _fpsBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [account],
				});
				setFpsBalance(_fpsBalance);

				const _fpsHolding = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: EquityABI,
					functionName: "holdingDuration",
					args: [account],
				});
				setFpsHolding(_fpsHolding);

				const _wfpsBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].DEPSwrapper,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [account],
				});
				setWfpsBalance(_wfpsBalance);
			}

			const _wfpsHolding = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "holdingDuration",
				args: [ADDRESS[chainId].DEPSwrapper],
			});
			setWfpsHolding(_wfpsHolding);
		};

		fetchAsync();
	}, [data, account, chainId]);

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
					title: "Amount:",
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].DEPSwrapper),
				},
				{
					title: "Transaction:",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
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
					title: "Amount:",
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Receive: ",
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Wrapping ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Wrapped ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
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
					title: "Amount:",
					value: formatBigInt(amount) + " " + POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Receive: ",
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Unwrapping ${POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Unwrapped ${POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setUnwrapping(false);
		}
	};

	const fromBalance = direction ? fpsBalance : wfpsBalance;
	const fromSymbol = direction ? NATIVE_POOL_SHARE_TOKEN_SYMBOL : POOL_SHARE_TOKEN_SYMBOL;
	const toSymbol = !direction ? NATIVE_POOL_SHARE_TOKEN_SYMBOL : POOL_SHARE_TOKEN_SYMBOL;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fromBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	return (
		<>
			<div className="mt-8">
				<TokenInputSelect
					max={fromBalance}
					symbol={fromSymbol}
					symbolOptions={Object.keys(selectorMapping) || []}
					symbolOnChange={(o) => setTokenFromTo({ from: o.label, to: selectorMapping[o.label][0] })}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={fromSymbol + " Amount"}
				/>

				<div className="py-4 text-center z-0">
					<Button className={`h-10 rounded-full`} width="w-10" onClick={() => setTokenFromTo({ from: toSymbol, to: fromSymbol })}>
						<FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" />
					</Button>
				</div>

				<TokenInputSelect
					symbol={toSymbol}
					symbolOptions={selectorMapping[fromSymbol] || []}
					symbolOnChange={(o) => setTokenFromTo({ from: tokenFromTo.from, to: o.label })}
					hideMaxLabel
					output={Math.round(parseFloat(formatUnits(amount, 18)) * 10000) / 10000}
					label="Receive"
				/>
				<div className={`mt-2 px-1 transition-opacity`}>
					1 {fromSymbol} = 1 {toSymbol}
				</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn label={direction ? "Wrap" : "Unwrap"}>
						{direction ? (
							amount > fpsAllowance ? (
								<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									Approve
								</Button>
							) : (
								<Button disabled={amount == 0n || !!error} isLoading={isWrapping} onClick={() => handleWrapping()}>
									Wrap
								</Button>
							)
						) : (
							<Button isLoading={isUnwrapping} disabled={amount == 0n || !!error} onClick={() => handleUnwrapping()}>
								Unwrap
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount className="mt-4" amount={fpsBalance} currency={NATIVE_POOL_SHARE_TOKEN_SYMBOL} address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={`Holding Duration ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} />
					{fpsHolding > 0 && fpsHolding < 86_400 * 365 * 10 ? formatDuration(fpsHolding) : "-"}
				</AppBox>
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount className="mt-4" amount={wfpsBalance} currency={POOL_SHARE_TOKEN_SYMBOL} address={ADDRESS[chainId].DEPSwrapper} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={`Holding Duration ${POOL_SHARE_TOKEN_SYMBOL}`} />
					{wfpsHolding > 0 && wfpsHolding < 86_400 * 365 * 10 ? formatDuration(wfpsHolding) : "-"}
				</AppBox>
			</div>
		</>
	);
}
