import React, { useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import TokenInput from "@components/Input/TokenInput";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";

export default function EquityInteractionWithZCHFFPS() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isInversting, setInversting] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);

	const { address } = useAccount();
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const account = address || zeroAddress;

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
				abi: ABIS.EquityABI,
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
			setInversting(false);
		}
	};
	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const redeemWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: ABIS.EquityABI,
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
			setRedeeming(false);
		}
	};

	const { data: fpsResult, isLoading: shareLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: ABIS.EquityABI,
		functionName: "calculateShares",
		args: [amount],
	});

	const { data: frankenResult, isLoading: proceedLoading } = useReadContract({
		address: ADDRESS[chainId].equity,
		abi: ABIS.EquityABI,
		functionName: "calculateProceeds",
		args: [amount],
	});

	const fromBalance = direction ? poolStats.frankenBalance : poolStats.equityBalance;
	const result = (direction ? fpsResult : frankenResult) || 0n;
	const fromSymbol = direction ? "ZCHF" : "FPS";
	const toSymbol = !direction ? "ZCHF" : "FPS";
	const unlocked = poolStats.equityUserVotes > 86_400 * 90 && poolStats.equityUserVotes < 86_400 * 365 * 30;
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
			<div className="mt-2 px-1">
				Use your unused ZCHF to invest in FPS tokens or redeem your FPS tokens back to ZCHF after a 90-day holding period.
			</div>
			<div className="mt-8">
				<TokenInput
					max={fromBalance}
					symbol={fromSymbol}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={fromSymbol + " Amount"}
				/>
				<div className="py-4 text-center z-0">
					<button
						className={`btn btn-secondary z-0 text-slate-800 w-14 h-14 rounded-full transition ${direction && "rotate-180"}`}
						onClick={() => setDirection(!direction)}
					>
						<FontAwesomeIcon icon={faArrowRightArrowLeft} className="rotate-90 w-6 h-6" />
					</button>
				</div>
				<TokenInput symbol={toSymbol} hideMaxLabel output={formatUnits(result, 18)} label="Receive" />
				<div className={`mt-2 px-1 transition-opacity ${(shareLoading || proceedLoading) && "opacity-50"}`}>{conversionNote()}</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn>
						{direction ? (
							amount > poolStats.frankenAllowance ? (
								<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									Approve
								</Button>
							) : (
								<Button
									variant="primary"
									disabled={amount == 0n || !!error}
									isLoading={isInversting}
									onClick={() => handleInvest()}
								>
									Invest
								</Button>
							)
						) : (
							<Button
								variant="primary"
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
					<span className={!unlocked ? "text-red-500 font-bold" : ""}>
						{poolStats.equityBalance > 0 ? formatDuration(poolStats.equityHoldingDuration) : "-"}
					</span>
				</AppBox>
				<AppBox className="flex-1">
					<DisplayLabel label="Can redeem after" />
					{formatDuration(redeemLeft)}
				</AppBox>
			</div>
		</>
	);
}
