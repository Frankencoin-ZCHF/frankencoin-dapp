import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
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
import { ADDRESS, EquityABI, FPSWrapperABI } from "@frankencoin/zchf";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function EquityInteractionWithWFPSRedeem({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const [wfpsAllowance, setWfpsAllowance] = useState<bigint>(0n);
	const [wfpsBalance, setWfpsBalance] = useState<bigint>(0n);
	const [wfpsHolding, setWfpsHolding] = useState<bigint>(0n);
	const [calculateProceeds, setCalculateProceeds] = useState<bigint>(0n);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const poolStats = usePoolStats();
	const chainId = useChainId();
	const account = address || zeroAddress;
	const direction: boolean = true;

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [tokenFromTo]);

	useEffect(() => {
		const fetchAsync = async function () {
			if (account != zeroAddress) {
				const _wfpsAllowance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].wFPS,
					abi: erc20Abi,
					functionName: "allowance",
					args: [account, ADDRESS[chainId].wFPS],
				});
				setWfpsAllowance(_wfpsAllowance);

				const _wfpsBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].wFPS,
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
				args: [ADDRESS[chainId].wFPS],
			});
			setWfpsHolding(_wfpsHolding);
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
				address: ADDRESS[chainId].wFPS,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].wFPS, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " WFPS",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].wFPS),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving WFPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved WFPS" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: FPSWrapperABI,
				functionName: "unwrapAndSell",
				args: [amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " WFPS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(calculateProceeds) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Unwrap and Redeeming WFPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed WFPS" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setRedeeming(false);
		}
	};

	const fromSymbol = "WFPS";
	const toSymbol = "ZCHF";
	const unlocked = wfpsHolding > 86_400 * 90 && wfpsHolding < 86_400 * 365 * 30;
	const redeemLeft = unlocked ? 0n : 86_400n * 90n - wfpsHolding;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > wfpsBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	const conversionNote = () => {
		if (amount != 0n && calculateProceeds != 0n) {
			const ratio = (calculateProceeds * BigInt(1e18)) / amount;
			return `1 ${fromSymbol} = ${formatUnits(ratio, 18)} ${toSymbol}`;
		} else {
			return `${toSymbol} price is calculated dynamically.\n`;
		}
	};

	return (
		<>
			<div className="mt-8">
				<TokenInputSelect
					max={wfpsBalance}
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
					output={Math.round(parseFloat(formatUnits(calculateProceeds, 18)) * 10000) / 10000}
					label="Receive"
				/>
				<div className={`mt-2 px-1 transition-opacity`}>{conversionNote()}</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn label="Unwrap and Redeem">
						{amount > wfpsAllowance ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleApprove()}>
								Approve
							</Button>
						) : (
							<Button isLoading={isRedeeming} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleRedeem()}>
								Unwrap and Redeem
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount className="mt-4" amount={wfpsBalance} currency="WFPS" address={ADDRESS[chainId].wFPS} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Current Price" />
					<DisplayAmount
						className="mt-4"
						amount={(poolStats.equityPrice * wfpsBalance) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration WFPS Contract" />
					<span className={!unlocked ? "text-text-warning font-bold" : ""}>
						{wfpsHolding > 0 && wfpsHolding < 86_400 * 365 * 10 ? formatDuration(wfpsHolding) : "-"}
					</span>
				</AppBox>
				<AppBox className="flex-1">
					<DisplayLabel label="Can redeem after" />
					<span className={!unlocked ? "text-text-warning font-bold" : ""}>{formatDuration(redeemLeft)}</span>
				</AppBox>
			</div>
		</>
	);
}
