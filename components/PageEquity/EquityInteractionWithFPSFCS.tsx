import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { useFCSStats, track } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useConnection } from "wagmi";
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
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	tokenFromTo: { from: string; to: string };
	setTokenFromTo: (set: { from: string; to: string }) => void;
	selectorMapping: { [key: string]: string[] };
}

export default function EquityInteractionWithFPSFCS({ tokenFromTo, setTokenFromTo, selectorMapping }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isWrapping, setWrapping] = useState(false);
	const [isUnwrapping, setUnwrapping] = useState(false);

	const { address } = useConnection();
	const chainId = mainnet.id;
	const account = address || zeroAddress;
	const direction: boolean = tokenFromTo.from === "FPS";
	const fcsStats = useFCSStats();

	useEffect(() => {
		setAmount(0n);
		setError("");
	}, [tokenFromTo]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				chainId: chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].fcs, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FPS",
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
					render: <TxToast title={`Approving FPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved FPS" rows={toastContent} />,
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
				address: ADDRESS[chainId].fcs,
				chainId: chainId,
				abi: FCSABI,
				functionName: "wrap",
				args: [amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FPS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(amount) + " FCS",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Wrapping FPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Wrapped FPS" rows={toastContent} />,
				},
			});

			track("fcs_wrapped", { amount: formatBigInt(amount) });
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
				address: ADDRESS[chainId].fcs,
				chainId: chainId,
				abi: FCSABI,
				functionName: "unwrap",
				args: [amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FCS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(amount) + " FPS",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Unwrapping FCS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Unwrapped FCS" rows={toastContent} />,
				},
			});

			track("fcs_unwrapped", { amount: formatBigInt(amount) });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAmount(0n);
			setUnwrapping(false);
		}
	};

	const fromBalance = direction ? fcsStats.fpsBalance : fcsStats.fcsBalance;
	const fromSymbol = direction ? "FPS" : "FCS";
	const toBalance = !direction ? fcsStats.fpsBalance : fcsStats.fcsBalance;
	const toSymbol = !direction ? "FPS" : "FCS";

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
					output={Math.round(parseFloat(formatUnits(amount, 18)) * 10000) / 10000}
					label="Receive"
					disabled={true}
					limit={toBalance}
					limitDigit={18}
					limitLabel="Balance"
				/>
				<div className={`mt-2 px-1 transition-opacity`}>
					1 {fromSymbol} = 1 {toSymbol}
				</div>

				{!direction && !fcsStats.fcsCanUnwrap ? (
					<div className="mt-2 px-1 text-red-500">
						Not eligible to unwrap yet — your FCS holding duration ({formatDuration(fcsStats.fcsHoldingDuration)}) must reach
						the average holding duration ({formatDuration(fcsStats.fcsAverageHoldingDuration)}) first.
					</div>
				) : null}

				<div className="mx-auto mt-8 w-full flex-col">
					<GuardSupportedChain chain={mainnet}>
						{direction ? (
							amount > fcsStats.fpsAllowanceForFcs ? (
								<AppButton isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => handleApprove()}>
									Approve
								</AppButton>
							) : (
								<AppButton disabled={amount == 0n || !!error} isLoading={isWrapping} onClick={() => handleWrapping()}>
									Wrap
								</AppButton>
							)
						) : (
							<AppButton
								isLoading={isUnwrapping}
								disabled={amount == 0n || !!error || !fcsStats.fcsCanUnwrap}
								onClick={() => handleUnwrapping()}
							>
								Unwrap
							</AppButton>
						)}
					</GuardSupportedChain>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={fcsStats.fpsBalance} currency="FPS" address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={fcsStats.fcsBalance} currency="FCS" address={ADDRESS[chainId].fcs} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration FCS" />
					<DisplayOutputAlignedRight
						textColorOutput={!fcsStats.fcsCanUnwrap ? "text-red-500" : undefined}
						output={fcsStats.fcsBalance > 0 ? formatDuration(fcsStats.fcsHoldingDuration) : "-"}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Average Holding Duration FCS" />
					<DisplayOutputAlignedRight output={formatDuration(fcsStats.fcsAverageHoldingDuration)} />
				</AppBox>
			</div>
		</>
	);
}
