import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function EquityInteractionWithZCHFFPS({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isInversting, setInversting] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);

	const { address } = useAccount();
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const account = address || zeroAddress;
	const direction: boolean = tokenFromTo.from === "ZCHF";

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [tokenFromTo]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].equity, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " ZCHF",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].equity),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved ZCHF" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setApproving(false);
		}
	};
	const handleInvest = async () => {
		try {
			const investWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "invest",
				args: [amount, result],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount, 18) + " ZCHF",
				},
				{
					title: "Shares: ",
					value: formatBigInt(result) + " FPS",
				},
				{
					title: "Transaction: ",
					hash: investWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: investWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Investing ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Invested" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setAmount(0n);
			setInversting(false);
		}
	};
	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const redeemWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "redeem",
				args: [account, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FPS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(result) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: redeemWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: redeemWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Redeeming FPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setAmount(0n);
			setRedeeming(false);
		}
	};

	const { data: fpsResult, isLoading: shareLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateShares",
		args: [amount],
	});

	const { data: frankenResult, isLoading: proceedLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
		functionName: "calculateProceeds",
		args: [amount],
	});

	const fromBalance = direction ? poolStats.frankenBalance : poolStats.equityBalance;
	const result = (direction ? fpsResult : frankenResult) || 0n;
	const fromSymbol = direction ? "ZCHF" : "FPS";
	const toSymbol = !direction ? "ZCHF" : "FPS";
	const unlocked =
		poolStats.equityUserVotes > 86_400 * 90 && poolStats.equityUserVotes < 86_400 * 365 * 30 && poolStats.equityUserVotes > 0n;
	const redeemLeft = 86400n * 90n - (poolStats.equityBalance ? poolStats.equityUserVotes / poolStats.equityBalance / 2n ** 20n : 0n);

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fromBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	const conversionNote = () => {
		if (amount != 0n && result != 0n) {
			const ratio = (result * BigInt(1e18)) / amount;
			return `1 ${fromSymbol} = ${formatUnits(ratio, 18)} ${toSymbol}`;
		} else {
			return `${toSymbol} price is calculated dynamically.\n`;
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
					output={Math.round(parseFloat(formatUnits(result, 18)) * 10000) / 10000}
					label="Receive"
				/>

				<div className={`mt-2 px-1 transition-opacity ${(shareLoading || proceedLoading) && "opacity-50"}`}>{conversionNote()}</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn label={direction ? "Mint" : "Redeem"}>
						{direction ? (
							amount > poolStats.frankenAllowance ? (
								<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									Approve
								</Button>
							) : (
								<Button disabled={amount == 0n || !!error} isLoading={isInversting} onClick={() => handleInvest()}>
									Mint
								</Button>
							)
						) : (
							<Button
								isLoading={isRedeeming}
								disabled={amount == 0n || !!error || !poolStats.equityCanRedeem}
								onClick={() => handleRedeem()}
							>
								Redeem
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={poolStats.equityBalance} currency="FPS" address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Current Price" />
					<DisplayAmount
						amount={(poolStats.equityPrice * poolStats.equityBalance) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration" />
					<span className={!unlocked ? "text-text-warning font-bold" : ""}>
						{poolStats.equityBalance > 0 ? formatDuration(poolStats.equityHoldingDuration) : "-"}
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
