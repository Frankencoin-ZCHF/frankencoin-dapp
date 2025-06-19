import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { useContractUrl, useSwapVCHFStats } from "@hooks";
import { erc20Abi, maxUint256 } from "viem";
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
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

export default function Swap() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [errorBridge, setErrorBridge] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isMinting, setMinting] = useState(false);
	const [isBurning, setBurning] = useState(false);
	const [isMinter, setMinter] = useState<bigint>(0n);

	const chainId = mainnet.id;
	const swapStats = useSwapVCHFStats();

	const other = ADDRESS[chainId].vchfToken;
	const bridge = ADDRESS[chainId].stablecoinBridgeVCHF;
	const bridgeUrl = useContractUrl(bridge);

	const activeMinter = isMinter > 0 && isMinter * 1000n <= Date.now();
	const fromBalance = direction ? swapStats.otherUserBal : swapStats.zchfUserBal;
	const toBalance = !direction ? swapStats.otherUserBal : swapStats.zchfUserBal;
	const fromSymbol = direction ? swapStats.otherSymbol : "ZCHF";
	const toSymbol = !direction ? swapStats.otherSymbol : "ZCHF";
	const swapLimit = direction ? swapStats.bridgeLimit - swapStats.otherBridgeBal : swapStats.otherBridgeBal;

	useEffect(() => {
		const fetcher = async () => {
			const active = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankencoin,
				chainId,
				abi: FrankencoinABI,
				functionName: "minters",
				args: [bridge],
			});

			if (active != isMinter) setMinter(active);
		};

		fetcher();
	}, [bridge, chainId, isMinter]);

	useEffect(() => {
		const horizon = new Date(Number(swapStats.bridgeHorizon * 1000n));

		if (!activeMinter) {
			setErrorBridge("The swap module has not yet completed the governance process.");
		} else if (horizon.getTime() < Date.now() && direction) {
			setErrorBridge(`Swap module has expired on ${horizon.toDateString()}`);
		} else {
			setErrorBridge("");
		}
	}, [activeMinter, swapStats, direction]);

	useEffect(() => {
		if (amount > fromBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else if (amount > swapLimit) {
			setError(`Not enough ${toSymbol} available to swap.`);
		} else {
			setError("");
		}
	}, [amount, direction, fromBalance, fromSymbol, swapLimit, toSymbol]);

	const handleApprove = async () => {
		try {
			setApproving(true);
			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: other,
				chainId,
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
				chainId,
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
				chainId,
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

	const onChangeDirection = () => {
		setDirection(!direction);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
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
							The <AppLink className="" label="swap module" href={bridgeUrl} external={true} /> enables 1:1 conversion between
							other Swiss Franc stablecoins and back, up to certain limits. Currently,{" "}
							<AppLink className="" label="VNX Swiss Franc (VCHF)" href="https://vnx.li/vchf/" external={true} /> is
							supported.
						</div>

						<div className="mt-8">
							<TokenInput
								max={fromBalance}
								reset={0n}
								symbol={fromSymbol}
								limit={fromBalance}
								limitLabel="Balance"
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
							limit={swapLimit}
							limitLabel="Available"
							value={amount.toString()}
							note={`1 ${fromSymbol} = 1 ${toSymbol}`}
							label="Receive"
							disabled={true}
							error={errorBridge}
						/>

						<div className="mx-auto mt-8 w-72 max-w-full flex-col">
							<GuardSupportedChain chain={mainnet}>
								{direction ? (
									amount > swapStats.otherUserAllowance ? (
										<Button disabled={!activeMinter || !!error} isLoading={isApproving} onClick={() => handleApprove()}>
											Approve
										</Button>
									) : (
										<Button
											disabled={amount == 0n || !activeMinter || !!error}
											isLoading={isMinting}
											onClick={() => handleMint()}
										>
											Swap
										</Button>
									)
								) : (
									<Button isLoading={isBurning} disabled={amount == 0n || !!error} onClick={() => handleBurn()}>
										Swap
									</Button>
								)}
							</GuardSupportedChain>
						</div>

						<div className="mt-6">
							You can also use the{" "}
							<AppLink
								className=""
								label="Uniswap App"
								href="https://app.uniswap.org/explore/tokens/ethereum/0xb58e61c3098d85632df34eecfb899a1ed80921cb"
								external={true}
							/>{" "}
							to swap other tokens for ZCHF.
						</div>
					</AppCard>
				</section>
			</div>
		</>
	);
}
