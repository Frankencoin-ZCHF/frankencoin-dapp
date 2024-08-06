import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import TokenInput from "@components/Input/TokenInput";
import { useState } from "react";
import { useContractUrl, useSwapStats } from "@hooks";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import Button from "@components/Button";
import { useChainId } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { SOCIAL, formatBigInt, shortenAddress } from "@utils";
import { TxToast, renderErrorToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../app.config";
import Link from "next/link";

export default function Swap() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isMinting, setMinting] = useState(false);
	const [isBurning, setBurning] = useState(false);

	const chainId = useChainId();
	const swapStats = useSwapStats();
	const xchfUrl = useContractUrl(ADDRESS[chainId].xchf);

	const handleApprove = async () => {
		try {
			setApproving(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].xchf,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].bridge, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].bridge),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title="Approving XCHF" rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved XCHF" rows={toastContent} />,
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
	const handleMint = async () => {
		try {
			setMinting(true);
			const mintWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].bridge,
				abi: ABIS.StablecoinBridgeABI,
				functionName: "mint",
				args: [amount],
			});

			const toastContent = [
				{
					title: `${fromSymbol} Amount: `,
					value: formatBigInt(amount) + " " + fromSymbol,
				},
				{
					title: `${toSymbol} Amount: `,
					value: formatBigInt(amount) + " " + toSymbol,
				},
				{
					title: "Transaction:",
					hash: mintWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: mintWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Swapping ${fromSymbol} to ${toSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Swapped ${fromSymbol} to ${toSymbol}`} rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setMinting(false);
		}
	};
	const handleBurn = async () => {
		try {
			setBurning(true);

			const burnWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].bridge,
				abi: ABIS.StablecoinBridgeABI,
				functionName: "burn",
				args: [amount],
			});

			const toastContent = [
				{
					title: `${fromSymbol} Amount: `,
					value: formatBigInt(amount) + " " + fromSymbol,
				},
				{
					title: `${toSymbol} Amount: `,
					value: formatBigInt(amount) + " " + toSymbol,
				},
				{
					title: "Transaction:",
					hash: burnWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: burnWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Swapping ${fromSymbol} to ${toSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Swapped ${fromSymbol} to ${toSymbol}`} rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setBurning(false);
		}
	};

	const fromBalance = direction ? swapStats.xchfUserBal : swapStats.zchfUserBal;
	const toBalance = !direction ? swapStats.xchfUserBal : swapStats.zchfUserBal;
	const fromSymbol = direction ? "XCHF" : "ZCHF";
	const toSymbol = !direction ? "XCHF" : "ZCHF";
	const swapLimit = direction ? swapStats.bridgeLimit - swapStats.xchfBridgeBal : swapStats.xchfBridgeBal;

	const onChangeDirection = () => {
		setDirection(!direction);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);

		if (valueBigInt > fromBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else if (valueBigInt > swapLimit) {
			setError(`Not enough ${toSymbol} available to swap.`);
		} else {
			setError("");
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Swap</title>
			</Head>

			<div className="md:mt-8">
				<section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
					<div className="bg-slate-950 rounded-xl p-8 flex flex-col">
						<Link href={xchfUrl}>
							<div className="mt-4 text-lg font-bold underline text-center">
								Swap XCHF and ZCHF
								<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
							</div>
						</Link>

						<div className="mt-8">
							<TokenInput
								max={fromBalance}
								symbol={fromSymbol}
								limit={swapLimit}
								limitLabel="Swap limit"
								placeholder={"Swap Amount"}
								onChange={onChangeAmount}
								value={amount.toString()}
								error={error}
							/>
						</div>

						<div className="py-4 text-center">
							<button
								className={`btn btn-secondary text-slate-800 w-14 h-14 rounded-full transition ${
									direction && "rotate-180"
								}`}
								onClick={onChangeDirection}
							>
								<FontAwesomeIcon icon={faArrowRightArrowLeft} className="rotate-90 w-6 h-6" />
							</button>
						</div>

						<TokenInput
							symbol={toSymbol}
							max={toBalance}
							output={formatUnits(amount, 18)}
							note={`1 ${fromSymbol} = 1 ${toSymbol}`}
							label="Receive"
						/>

						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								{direction ? (
									amount > swapStats.xchfUserAllowance ? (
										<Button isLoading={isApproving} onClick={() => handleApprove()}>
											Approve
										</Button>
									) : (
										<Button disabled={amount == 0n || !!error} isLoading={isMinting} onClick={() => handleMint()}>
											Swap
										</Button>
									)
								) : (
									<Button isLoading={isBurning} disabled={amount == 0n || !!error} onClick={() => handleBurn()}>
										Swap
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>

						<div className="mx-auto mt-8">
							<a
								href={SOCIAL.Uniswap_Mainnet}
								target="_blank"
								rel="noreferrer"
								className="flex items-center justify-center underline"
							>
								Also available on
								<picture>
									<img src="/assets/uniswap.svg" alt="logo" className="w-6 mb-2 mx-1" />
								</picture>
								Uniswap.
							</a>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
