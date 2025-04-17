import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { useContractUrl, useSwapVCHFStats } from "@hooks";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import Button from "@components/Button";
import { useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { formatBigInt, shortenAddress } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../app.config";
import AppCard from "@components/AppCard";
import { ADDRESS, FrankencoinABI, StablecoinBridgeABI } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";

export default function Swap() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isMinting, setMinting] = useState(false);
	const [isBurning, setBurning] = useState(false);
	const [isMinter, setMinter] = useState<bigint>(0n);

	const chainId = useChainId();
	const swapStats = useSwapVCHFStats();

	const other = ADDRESS[chainId].vchf;
	const bridge = ADDRESS[chainId].stablecoinBridgeVCHF;
	const bridgeUrl = useContractUrl(bridge);

	useEffect(() => {
		const fetcher = async () => {
			const active = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: FrankencoinABI,
				functionName: "minters",
				args: [bridge],
			});

			if (active != isMinter) setMinter(active);
		};

		fetcher();
	}, [bridge, chainId, isMinter]);

	const handleApprove = async () => {
		try {
			setApproving(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: other,
				abi: erc20Abi,
				functionName: "approve",
				args: [bridge, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite",
				},
				{
					title: "Spender: ",
					value: shortenAddress(bridge),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ${fromSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${fromSymbol}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};
	const handleMint = async () => {
		try {
			setMinting(true);
			const mintWriteHash = await writeContract(WAGMI_CONFIG, {
				address: bridge,
				abi: StablecoinBridgeABI,
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
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setMinting(false);
		}
	};
	const handleBurn = async () => {
		try {
			setBurning(true);

			const burnWriteHash = await writeContract(WAGMI_CONFIG, {
				address: bridge,
				abi: StablecoinBridgeABI,
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
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setBurning(false);
		}
	};

	const fromBalance = direction ? swapStats.otherUserBal : swapStats.zchfUserBal;
	const toBalance = !direction ? swapStats.otherUserBal : swapStats.zchfUserBal;
	const fromSymbol = direction ? swapStats.otherSymbol : "ZCHF";
	const toSymbol = !direction ? swapStats.otherSymbol : "ZCHF";
	const swapLimit = direction ? swapStats.bridgeLimit - swapStats.otherBridgeBal : swapStats.otherBridgeBal;
	const horizon = new Date(Number(swapStats.bridgeHorizon * 1000n));

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
				<section className="mx-auto max-w-2xl sm:px-8">
					<AppCard>
						<div className="mt-4 text-lg font-bold text-center">Swap {swapStats.otherSymbol} and ZCHF</div>

						<div className="mt-8">
							The <AppLink className="" label="Stablecoin Bridge" href={bridgeUrl} external={true} /> allows you to swao from{" "}
							{swapStats.otherSymbol} to ZCHF and is set to expire on {horizon.toDateString()}. Want to know more?{" "}
							<AppLink className="" label="VNX Swiss Franc (VCHF)" href="https://vnx.li/vchf/" external={true} />.
						</div>

						{isMinter == 0n ? (
							<div className="mt-4 text-sm text-text-secondary">*It looks like the bridge is not proposed yet.</div>
						) : isMinter * 1000n >= BigInt(Date.now()) ? (
							<div className="mt-4 text-sm text-text-secondary">
								*It looks like the bridge is still in the{" "}
								<AppLink className="" label="minters proposal" href="/governance" /> state.
							</div>
						) : null}

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

						<div className="py-4 text-center z-0">
							<Button className={`h-10 rounded-full`} width="w-10" onClick={onChangeDirection}>
								<FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" />
							</Button>
						</div>

						<TokenInput
							symbol={toSymbol}
							output={formatUnits(amount, 18)}
							note={`1 ${fromSymbol} = 1 ${toSymbol}`}
							label="Receive"
							disabled={true}
						/>

						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardToAllowedChainBtn>
								{direction ? (
									amount > swapStats.otherUserAllowance ? (
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
					</AppCard>
				</section>
			</div>
		</>
	);
}
