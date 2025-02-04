import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import Button from "@components/Button";
import { useSwapStats } from "@hooks";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { formatBigInt, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../app.config";
import AppCard from "@components/AppCard";
import { StablecoinBridgeABI } from "@deuro/eurocoin";
import TokenInputSelect from "@components/Input/TokenInputSelect";

const STABLECOIN_SYMBOLS = ["EURT", "EURC", "VEUR", "EURS"];

const noTokenMeta = {
	symbol: "",
	userBal: 0n,
	userAllowance: 0n,
	limit: 0n,
	minted: 0n,
	remaining: 0n,
	decimals: 0n,
	bridgeBal: 0n,
	contractBridgeAddress: "0x0",
	contractAddress: "0x0",
};

const rebaseDecimals = (amount: bigint, fromDecimals: bigint, toDecimals: bigint) => {
	return (amount * 10n ** toDecimals) / 10n ** fromDecimals;
};

const getAmountWithLeastPrecision = (amount: bigint, fromDecimals: bigint, toDecimals: bigint) => {
	const potentialAmount = rebaseDecimals(rebaseDecimals(amount, fromDecimals, toDecimals), toDecimals, fromDecimals);
	return potentialAmount > amount ? amount : potentialAmount;
};

export default function Swap() {
	const [fromSymbol, setFromSymbol] = useState(TOKEN_SYMBOL);
	const [fromOptions, setFromOptions] = useState([TOKEN_SYMBOL]);
	const [toSymbol, setToSymbol] = useState(STABLECOIN_SYMBOLS[0]);
	const [toOptions, setToOptions] = useState(STABLECOIN_SYMBOLS);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isTxOnGoing, setTxOnGoing] = useState(false);

	const swapStats = useSwapStats();

	const getSelectedStablecoinSymbol = useCallback(() => {
		return fromSymbol === TOKEN_SYMBOL ? toSymbol : fromSymbol;
	}, [fromSymbol, toSymbol]);

	const getTokenMetaBySymbol = useCallback(
		(symbol: string) => {
			switch (symbol) {
				case TOKEN_SYMBOL:
					const stablecoinSymbol = getSelectedStablecoinSymbol();
					const userAllowance = swapStats.dEuro.bridgeAllowance[stablecoinSymbol as keyof typeof swapStats.dEuro.bridgeAllowance];
					return {
						symbol: TOKEN_SYMBOL,
						userBal: swapStats.dEuro.userBal,
						userAllowance: userAllowance,
						limit: 0n,
						minted: 0n,
						remaining: 0n,
						decimals: swapStats.dEuro.decimals,
						bridgeBal: 0n,
						contractBridgeAddress: "0x0",
						contractAddress: swapStats.dEuro.contractAddress,
					};
				case "EURT":
					return swapStats.eurt;
				case "EURC":
					return swapStats.eurc;
				case "VEUR":
					return swapStats.veur;
				case "EURS":
					return swapStats.eurs;
				default:
					return noTokenMeta;
			}
		},
		[swapStats, getSelectedStablecoinSymbol]
	);

	const onChangeAmount = useCallback(
		(value: string) => {
			const valueBigInt = BigInt(value);
			const fromTokenDecimals = getTokenMetaBySymbol(fromSymbol).decimals;
			const toTokenDecimals = getTokenMetaBySymbol(toSymbol).decimals;
			const newAmount = getAmountWithLeastPrecision(valueBigInt, fromTokenDecimals, toTokenDecimals);
			setAmount(newAmount);
		},
		[fromSymbol, toSymbol, getTokenMetaBySymbol]
	);

	const onChangeDirection = () => {
		// swap symbols
		const prevFromSymbol = fromSymbol;
		const prevToSymbol = toSymbol;
		setFromSymbol(prevToSymbol);
		setToSymbol(prevFromSymbol);

		// swap options
		const prevFromOptions = fromOptions;
		const prevToOptions = toOptions;
		setFromOptions(prevToOptions);
		setToOptions(prevFromOptions);

		if (amount > 0n) {
			const fromTokenData = getTokenMetaBySymbol(fromSymbol);
			const toTokenData = getTokenMetaBySymbol(toSymbol);
			const newAmount = rebaseDecimals(amount, fromTokenData.decimals, toTokenData.decimals);
			setAmount(newAmount);
		}
	};

	const onSetFromSymbol = (symbol: string) => {
		if (amount > 0n) {
			const newToken = getTokenMetaBySymbol(symbol);
			const oldToken = getTokenMetaBySymbol(fromSymbol);
			const newAmount = rebaseDecimals(amount, oldToken.decimals, newToken.decimals);
			setAmount(newAmount);
		}
		setFromSymbol(symbol);
	};

	const onSetToSymbol = (symbol: string) => {
		if (amount > 0n) {
			const fromTokenDecimals = getTokenMetaBySymbol(fromSymbol).decimals;
			const newTokenDecimals = getTokenMetaBySymbol(symbol).decimals;
			const newAmount = getAmountWithLeastPrecision(amount, fromTokenDecimals, newTokenDecimals);
			setAmount(newAmount);
		}
		setToSymbol(symbol);
	};

	// Only for triggering errors when the amount or the symbol is changed
	useEffect(() => {
		const fromTokenData = getTokenMetaBySymbol(fromSymbol);
		const toTokenData = getTokenMetaBySymbol(toSymbol);
		const isBurning = fromSymbol === TOKEN_SYMBOL;
		const isMinting = toSymbol === TOKEN_SYMBOL;

		// For adjusting because of the decimal differences between the two token contracts
		const forwardSubtraction = fromTokenData.decimals - toTokenData.decimals;
		const backwardSubtraction = toTokenData.decimals - fromTokenData.decimals;
		const forwardCoefficient = Number(forwardSubtraction) > 0 ? 10n ** BigInt(forwardSubtraction) : 1n;
		const backwardCoefficient = Number(backwardSubtraction) > 0 ? 10n ** BigInt(backwardSubtraction) : 1n;

		if (amount > fromTokenData.userBal) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else if (isBurning && amount * backwardCoefficient > toTokenData.bridgeBal * forwardCoefficient) {
			setError(`Not enough ${toSymbol} available to swap.`);
		} else if (isMinting && amount * backwardCoefficient > fromTokenData.remaining * forwardCoefficient) {
			setError(`Amount exceeds the swap limit.`);
		} else {
			setError("");
		}
	}, [amount, fromSymbol, toSymbol, getTokenMetaBySymbol]);

	const handleApprove = async () => {
		try {
			setTxOnGoing(true);
			const fromTokenData = getTokenMetaBySymbol(fromSymbol);
			const fromContractAddress = fromTokenData.contractAddress;

			const stablecoinSymbol = getSelectedStablecoinSymbol();
			const bridgeAddress = getTokenMetaBySymbol(stablecoinSymbol).contractBridgeAddress as `0x${string}`;

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: fromContractAddress as `0x${string}`,
				abi: erc20Abi,
				functionName: "approve",
				args: [bridgeAddress, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite",
				},
				{
					title: "Spender: ",
					value: shortenAddress(bridgeAddress),
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
			setTxOnGoing(false);
		}
	};

	// You send an stable coin and receive dEUROs
	const handleMint = async () => {
		try {
			setTxOnGoing(true);
			const stablecoinSymbol = getSelectedStablecoinSymbol();
			const bridgeAddress = getTokenMetaBySymbol(stablecoinSymbol).contractBridgeAddress as `0x${string}`;

			const mintWriteHash = await writeContract(WAGMI_CONFIG, {
				address: bridgeAddress,
				abi: StablecoinBridgeABI,
				functionName: "mint",
				args: [amount],
			});

			const fromDecimals = getTokenMetaBySymbol(fromSymbol).decimals;

			const toastContent = [
				{
					title: `${fromSymbol} Amount: `,
					value: formatBigInt(amount, Number(fromDecimals)) + " " + fromSymbol,
				},
				{
					title: `${toSymbol} Amount: `,
					value: formatBigInt(amount, Number(fromDecimals)) + " " + toSymbol,
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
			setTxOnGoing(false);
		}
	};

	// You send dEUROs and receive and stable coin
	const handleBurn = async () => {
		try {
			setTxOnGoing(true);

			const stablecoinSymbol = getSelectedStablecoinSymbol();
			const bridgeAddress = getTokenMetaBySymbol(stablecoinSymbol).contractBridgeAddress as `0x${string}`;

			const burnWriteHash = await writeContract(WAGMI_CONFIG, {
				address: bridgeAddress,
				abi: StablecoinBridgeABI,
				functionName: "burn",
				args: [amount],
			});

			const fromDecimals = getTokenMetaBySymbol(fromSymbol).decimals;

			const toastContent = [
				{
					title: `${fromSymbol} Amount: `,
					value: formatBigInt(amount, Number(fromDecimals)) + " " + fromSymbol,
				},
				{
					title: `${toSymbol} Amount: `,
					value: formatBigInt(amount, Number(fromDecimals)) + " " + toSymbol,
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
			setTxOnGoing(false);
		}
	};

	const fromTokenMeta = getTokenMetaBySymbol(fromSymbol);
	const toTokenMeta = getTokenMetaBySymbol(toSymbol);

	const stablecoinMeta = getTokenMetaBySymbol(getSelectedStablecoinSymbol());
	const limit = fromSymbol === TOKEN_SYMBOL ? stablecoinMeta.bridgeBal : stablecoinMeta.remaining;

	const outputAmount = formatUnits(rebaseDecimals(amount, fromTokenMeta.decimals, toTokenMeta.decimals), Number(toTokenMeta.decimals));

	return (
		<>
			<Head>
				<title>dEURO - Swap</title>
			</Head>

			<div className="md:mt-8 flex justify-center">
				<AppCard className="max-w-lg p-4 gap-8">
					<div className="mb-2 sm:mb-4 pb-2 w-full self-stretch justify-center items-center gap-1.5 inline-flex">
						<div className="text-text-title text-center text-lg sm:text-xl font-black ">Swap {TOKEN_SYMBOL} for other stablecoins</div>
					</div>

					<div className="mt-8">
						<TokenInputSelect
							digit={fromTokenMeta.decimals}
							max={fromTokenMeta.userBal}
							symbol={fromTokenMeta.symbol}
							symbolOptions={fromOptions}
							symbolOnChange={(o) => onSetFromSymbol(o.value)}
							limit={limit}
							limitLabel="Swap limit"
							limitDigits={toTokenMeta.decimals}
							placeholder={"Swap Amount"}
							onChange={onChangeAmount}
							value={amount.toString()}
							error={error}
							hideLimitIcon
						/>
					</div>

					<div className="py-4 mt-1 text-center z-0">
						<Button className={`h-10 rounded-full`} width="w-10" onClick={onChangeDirection}>
							<FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" />
						</Button>
					</div>

					<TokenInputSelect
						digit={toTokenMeta.decimals}
						max={toTokenMeta.userBal}
						symbol={toTokenMeta.symbol}
						symbolOptions={toOptions}
						symbolOnChange={(o) => onSetToSymbol(o.value)}
						output={outputAmount}
						note={`1 ${fromSymbol} = 1 ${toSymbol}`}
						label="Receive"
						showMaxButton={false}
					/>

					<div className="mx-auto mt-8 w-72 max-w-full flex-col">
						<GuardToAllowedChainBtn>
							{amount > fromTokenMeta.userAllowance ? (
								<Button isLoading={isTxOnGoing} onClick={() => handleApprove()}>
									Approve
								</Button>
							) : fromSymbol === TOKEN_SYMBOL ? (
								<Button disabled={amount == 0n || !!error} isLoading={isTxOnGoing} onClick={() => handleBurn()}>
									Swap
								</Button>
							) : (
								<Button disabled={amount == 0n || !!error} isLoading={isTxOnGoing} onClick={() => handleMint()}>
									Swap
								</Button>
							)}
						</GuardToAllowedChainBtn>
					</div>
				</AppCard>
			</div>
		</>
	);
}
