import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { useSwapStats } from "@hooks";
import { formatUnits, maxUint256 } from "viem";
import Button from "@components/Button";
import { erc20ABI, useChainId, useContractWrite } from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { SOCIAL, formatBigInt, shortenAddress } from "@utils";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { useIsConnectedToCorrectChain } from "@hooks";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";

export default function Swap() {
	const [requestedChainChange, setRequestedChainChange] = useState(false);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isConfirming, setIsConfirming] = useState(false);

	const { isDisconnected } = useAccount();
	const isCorrectChain = useIsConnectedToCorrectChain();
	const Web3Modal = useWeb3Modal();
	const Web3ModalState = useWeb3ModalState();

	const chainId = useChainId();
	const swapStats = useSwapStats();
	const approveWrite = useContractWrite({
		address: ADDRESS[chainId].xchf,
		abi: erc20ABI,
		functionName: "approve",
	});
	const mintWrite = useContractWrite({
		address: ADDRESS[chainId].bridge,
		abi: ABIS.StablecoinBridgeABI,
		functionName: "mint",
	});
	const burnWrite = useContractWrite({
		address: ADDRESS[chainId].bridge,
		abi: ABIS.StablecoinBridgeABI,
		functionName: "burn",
	});
	const handleApprove = async () => {
		const tx = await approveWrite.writeAsync({
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
				hash: tx.hash,
			},
		];

		await toast.promise(waitForTransaction({ hash: tx.hash, confirmations: 1 }), {
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
	};
	const handleMint = async () => {
		const tx = await mintWrite.writeAsync({ args: [amount] });

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
				hash: tx.hash,
			},
		];

		await toast.promise(waitForTransaction({ hash: tx.hash, confirmations: 1 }), {
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
	};
	const handleBurn = async () => {
		const tx = await burnWrite.writeAsync({ args: [amount] });

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
				hash: tx.hash,
			},
		];

		await toast.promise(waitForTransaction({ hash: tx.hash, confirmations: 1 }), {
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

	useEffect(() => {
		if (requestedChainChange) {
			if (!isDisconnected && isCorrectChain && Web3ModalState.open) {
				Web3Modal.close();
				setRequestedChainChange(false);
			}
		}
	}, [requestedChainChange, isDisconnected, isCorrectChain, Web3Modal, Web3ModalState]);

	useEffect(() => console.log({ isDisconnected, isCorrectChain, chainId }), [isDisconnected, isCorrectChain, chainId]);

	return (
		<>
			<Head>
				<title>Frankencoin - Swap</title>
			</Head>
			<div>
				<AppPageHeader title="Swap XCHF and ZCHF" />
				<section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
					<div className="bg-slate-950 rounded-xl p-8">
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
								<p>Hiiii</p>
							</GuardToAllowedChainBtn>

							{/* WALLET VERIFY STEPS */}
							{/* isDisconnected */}
							{isDisconnected ? (
								<Button
									onClick={() => {
										Web3Modal.open();
										setRequestedChainChange(true);
									}}
								>
									Connect Wallet
								</Button>
							) : null}

							{/* isCorrectChain */}
							{!isDisconnected && !isCorrectChain ? (
								<Button
									onClick={() => {
										Web3Modal.open({ view: "Networks" });
										setRequestedChainChange(true);
									}}
								>
									Change Chain
								</Button>
							) : null}

							{/* allowance to low */}
							{!isDisconnected && isCorrectChain && (amount == BigInt(0) ? false : amount > swapStats.xchfUserAllowance) ? (
								<Button isLoading={approveWrite.isLoading || isConfirming} onClick={() => handleApprove()}>
									Approve
								</Button>
							) : null}

							{/* is mint */}
							{!isDisconnected &&
							isCorrectChain &&
							(amount == BigInt(0) ? true : swapStats.xchfUserAllowance > amount) &&
							direction ? (
								<Button
									disabled={amount == 0n || !!error}
									isLoading={mintWrite.isLoading || isConfirming}
									onClick={() => handleMint()}
								>
									Swap
								</Button>
							) : null}

							{/* is burn */}
							{!isDisconnected && isCorrectChain && swapStats.xchfUserAllowance > amount && !direction ? (
								<Button
									isLoading={burnWrite.isLoading || isConfirming}
									disabled={amount == 0n || !!error}
									onClick={() => handleBurn()}
								>
									Swap
								</Button>
							) : null}
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
