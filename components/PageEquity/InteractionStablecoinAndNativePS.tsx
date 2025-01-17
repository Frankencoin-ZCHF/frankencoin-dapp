import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, NATIVE_POOL_SHARE_TOKEN_SYMBOL, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowDownLong } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { ADDRESS, EquityABI, FrontendGatewayABI } from "@deuro/eurocoin";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { useFrontendGatewayStats } from "../../hooks/useFrontendGatewayStats";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function InteractionStablecoinAndNativePS({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isInversting, setInversting] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);

	const { frontendGatewayAllowance } = useFrontendGatewayStats();
	const { frontendCode } = useFrontendCode();
	const { address } = useAccount();
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const account = address || zeroAddress;
	const direction: boolean = tokenFromTo.from === TOKEN_SYMBOL;

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [tokenFromTo]);

	const handleApprove = async () => {
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
					title: "Amount:",
					value: formatBigInt(amount) + " " + TOKEN_SYMBOL,
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
					render: <TxToast title={`Approving ${TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${TOKEN_SYMBOL}`} rows={toastContent} />,
				},
			});
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
					title: "Amount:",
					value: formatBigInt(amount, 18) + " " + TOKEN_SYMBOL,
				},
				{
					title: "Shares: ",
					value: formatBigInt(result) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Transaction: ",
					hash: investWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: investWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Investing ${TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Invested" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
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
					value: formatBigInt(amount) + " " + NATIVE_POOL_SHARE_TOKEN_SYMBOL,
				},
				{
					title: "Receive: ",
					value: formatBigInt(result) + " " + TOKEN_SYMBOL,
				},
				{
					title: "Transaction: ",
					hash: redeemWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: redeemWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Redeeming ${NATIVE_POOL_SHARE_TOKEN_SYMBOL}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setRedeeming(false);
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
	const toSymbol = !direction ? TOKEN_SYMBOL : NATIVE_POOL_SHARE_TOKEN_SYMBOL;
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

	return (
		<>
			<div className="">
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

				<div className="py-1 text-center z-0">
					<Button className={`h-10 rounded-full mt-4`} width="w-10" onClick={() => setTokenFromTo({ from: toSymbol, to: fromSymbol })}>
						<FontAwesomeIcon icon={faArrowDownLong} className="w-5 h-5" />
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

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn label={direction ? "Mint" : "Redeem"}>
						{direction ? (
							amount > frontendGatewayAllowance ? (
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
					<DisplayAmount bold className="mt-2" amount={poolStats.equityBalance} currency={NATIVE_POOL_SHARE_TOKEN_SYMBOL} address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Current Price" />
					<DisplayAmount
						bold
						className="mt-2"
						amount={(poolStats.equityPrice * poolStats.equityBalance) / BigInt(1e18)}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration" />
					<div className={!unlocked ? "text-text-warning font-bold mt-2" : ""}>
						{poolStats.equityBalance > 0 ? formatDuration(poolStats.equityHoldingDuration) : "--"}
					</div>
				</AppBox>
				<AppBox className="flex-1">
					<DisplayLabel label="Can redeem after" />
					<div className={!unlocked ? "text-text-warning font-bold mt-2" : ""}>{formatDuration(redeemLeft)}</div>
				</AppBox>
			</div>
		</>
	);
}
