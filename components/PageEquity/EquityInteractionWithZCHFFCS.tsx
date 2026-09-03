import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { useFCSStats, track } from "@hooks";
import { formatBigInt, shortenAddress } from "@utils";
import { useConnection, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import AppButton from "@components/AppButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import { WAGMI_CONFIG } from "../../app.config";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { ADDRESS, FCSABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function EquityInteractionWithZCHFFCS({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isDepositing, setDepositing] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);

	const { address } = useConnection();
	const chainId = mainnet.id;
	const account = address || zeroAddress;
	const direction: boolean = tokenFromTo.from === "ZCHF";
	const fcsStats = useFCSStats();

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [tokenFromTo]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankencoin,
				chainId: chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].fcs, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " ZCHF",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].fcs),
				},
				{
					title: "Transaction:",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved ZCHF" rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};
	const handleDeposit = async () => {
		try {
			setDepositing(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].fcs,
				chainId: chainId,
				abi: FCSABI,
				functionName: "depositExpected",
				args: [amount, account, result],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount, 18) + " ZCHF",
				},
				{
					title: "Shares: ",
					value: formatBigInt(result) + " FCS",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Depositing ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Deposited" rows={toastContent} />,
				},
			});

			track("fcs_deposited", { zchf: formatBigInt(amount, 18), fcs: formatBigInt(result) });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setDepositing(false);
		}
	};
	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].fcs,
				chainId: chainId,
				abi: FCSABI,
				functionName: "redeemExpected",
				args: [account, amount, result],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FCS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(result) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Redeeming FCS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed" rows={toastContent} />,
				},
			});

			track("fcs_redeemed", { fcs: formatBigInt(amount), zchf: formatBigInt(result, 18) });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setRedeeming(false);
		}
	};

	const { data: fcsResult, isLoading: shareLoading } = useReadContract({
		address: ADDRESS[chainId].fcs,
		chainId: chainId,
		abi: FCSABI,
		functionName: "previewDeposit",
		args: [amount],
	});

	const { data: frankenResult, isLoading: proceedLoading } = useReadContract({
		address: ADDRESS[chainId].fcs,
		chainId: chainId,
		abi: FCSABI,
		functionName: "previewRedeem",
		args: [amount],
	});

	const fromBalance = direction ? fcsStats.frankenBalance : fcsStats.fcsBalance;
	const toBalance = !direction ? fcsStats.frankenBalance : fcsStats.fcsBalance;
	const result = (direction ? fcsResult : frankenResult) || 0n;
	const fromSymbol = direction ? "ZCHF" : "FCS";
	const toSymbol = !direction ? "ZCHF" : "FCS";
	const canRedeem = fcsStats.fcsMaxRedeem > 0n;

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
			const ratio = (100n * amount) / result;
			return `1 ${toSymbol} = ${formatUnits(ratio, 2)} ${fromSymbol}`;
		} else {
			return ``;
		}
	};

	return (
		<>
			<div className="mt-8">
				<TokenInputSelect
					max={fromBalance}
					min={0n}
					symbol={fromSymbol}
					symbolOptions={Object.keys(selectorMapping) || []}
					symbolOnChange={(o) => setTokenFromTo({ from: o.label, to: selectorMapping[o.label][0] })}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={fromSymbol + " Amount"}
					limit={fromBalance}
					limitDigit={18}
					limitLabel="Balance"
				/>

				<div className="py-4 text-center z-0">
					<AppButton
						className={`h-10 rounded-full`}
						width="w-10"
						onClick={() => setTokenFromTo({ from: toSymbol, to: fromSymbol })}
					>
						<FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" />
					</AppButton>
				</div>

				<TokenInputSelect
					symbol={toSymbol}
					symbolOptions={selectorMapping[fromSymbol] || []}
					symbolOnChange={(o) => setTokenFromTo({ from: tokenFromTo.from, to: o.label })}
					hideMaxLabel
					output={Math.round(parseFloat(formatUnits(result, 18)) * 10000) / 10000}
					label="Receive"
					disabled={true}
					limit={toBalance}
					limitDigit={18}
					limitLabel="Balance"
				/>

				<div className={`mt-2 px-1 transition-opacity ${(shareLoading || proceedLoading) && "opacity-50"}`}>{conversionNote()}</div>

				{!direction && !canRedeem ? (
					<div className="mt-2 px-1 text-red-500">
						Redemptions are currently disabled — FCS must be binding (holding more than 2/3 of all FPS votes) and FPS1
						redemptions must be open before FCS can be redeemed for ZCHF.
					</div>
				) : null}

				<div className="mx-auto mt-8 w-full flex-col">
					<GuardSupportedChain chain={mainnet}>
						{direction ? (
							amount > fcsStats.frankenAllowanceForFcs ? (
								<AppButton isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									Approve
								</AppButton>
							) : (
								<AppButton disabled={amount == 0n || !!error} isLoading={isDepositing} onClick={() => handleDeposit()}>
									Deposit
								</AppButton>
							)
						) : (
							<AppButton
								isLoading={isRedeeming}
								disabled={amount == 0n || !!error || !canRedeem}
								onClick={() => handleRedeem()}
							>
								Redeem
							</AppButton>
						)}
					</GuardSupportedChain>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={fcsStats.fcsBalance} currency="FCS" address={ADDRESS[chainId].fcs} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Ask Price" />
					<DisplayAmount
						amount={(fcsStats.fcsAsk * fcsStats.fcsBalance) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankencoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Ask (buy price)" />
					<DisplayAmount amount={fcsStats.fcsAsk} currency="ZCHF" address={ADDRESS[chainId].frankencoin} hideLogo />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Bid (sell price)" />
					<DisplayAmount amount={fcsStats.fcsBid} currency="ZCHF" address={ADDRESS[chainId].frankencoin} hideLogo />
				</AppBox>
			</div>
		</>
	);
}
