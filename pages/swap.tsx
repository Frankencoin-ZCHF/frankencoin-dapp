import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import Button from "@components/Button";
import { useSwapStats } from "@hooks";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { formatBigInt, formatCurrency, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../app.config";
import AppCard from "@components/AppCard";
import { StablecoinBridgeABI } from "@deuro/eurocoin";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { InputTitle } from "@components/Input/InputTitle";
import { MaxButton } from "@components/Input/MaxButton";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";
import { TokenModalRowButton, TokenSelectModal } from "@components/TokenSelectModal";

enum TokenInteractionSide {
	INPUT = "input",
	OUTPUT = "output",
}

const STABLECOIN_SYMBOLS = ["EURC", "VEUR", "EURS", "EURR", "EUROP", "EURI", "EURE", "EURA"];

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
	const [fromSymbol, setFromSymbol] = useState(STABLECOIN_SYMBOLS[0]);
	const [fromOptions, setFromOptions] = useState(STABLECOIN_SYMBOLS);
	const [toSymbol, setToSymbol] = useState(TOKEN_SYMBOL);
	const [toOptions, setToOptions] = useState([TOKEN_SYMBOL]);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isTxOnGoing, setTxOnGoing] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [interactionSide, setInteractionSide] = useState<TokenInteractionSide>();
	const eurPrice = useSelector((state: RootState) => state.prices.eur?.usd);
	const swapStats = useSwapStats();
	const { t } = useTranslation();

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
				case "EURC":
					return swapStats.eurc;
				case "VEUR":
					return swapStats.veur;
				case "EURS":
					return swapStats.eurs;
				case "EURR":
					return swapStats.eurr;
				case "EUROP":
					return swapStats.europ;
				case "EURI":
					return swapStats.euri;
				case "EURE":
					return swapStats.eure;
				case "EURA":
					return swapStats.eura;
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
		setToSymbol(TOKEN_SYMBOL);
	};

	const onSetToSymbol = (symbol: string) => {
		if (amount > 0n) {
			const fromTokenDecimals = getTokenMetaBySymbol(fromSymbol).decimals;
			const newTokenDecimals = getTokenMetaBySymbol(symbol).decimals;
			const newAmount = getAmountWithLeastPrecision(amount, fromTokenDecimals, newTokenDecimals);
			setAmount(newAmount);
		}
		setToSymbol(symbol);
		setFromSymbol(TOKEN_SYMBOL);
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
			setError(t("common.error.insufficient_balance", { symbol: fromSymbol }));
		} else if (isBurning && amount * backwardCoefficient > toTokenData.bridgeBal * forwardCoefficient) {
			setError(t("swap.error.insufficient_bridge", { symbol: toSymbol }));
		} else if (isMinting && amount * backwardCoefficient > fromTokenData.remaining * forwardCoefficient) {
			setError(t("swap.error.exceeds_limit"));
		} else {
			setError("");
		}
	}, [amount, fromSymbol, toSymbol, getTokenMetaBySymbol, t]);

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
					title: t("common.txs.amount"),
					value: "infinite",
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(bridgeAddress),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: fromSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: fromSymbol })} rows={toastContent} />,
				},
			});
			await swapStats.refetch();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: need to translate
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
					title: t("swap.swap_tx.amount_from", { symbol: fromSymbol }),
					value: formatBigInt(amount, Number(fromDecimals)) + " " + fromSymbol,
				},
				{
					title: t("swap.swap_tx.amount_to", { symbol: toSymbol }),
					value: formatBigInt(amount, Number(fromDecimals)) + " " + toSymbol,
				},
				{
					title: t("common.txs.transaction"),
					hash: mintWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: mintWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("swap.swap_tx.title", { fromSymbol, toSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("swap.swap_tx.success", { fromSymbol, toSymbol })} rows={toastContent} />,
				},
			});
			swapStats.refetch();
			setAmount(0n);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: need to translate
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
					title: t("swap.swap_tx.amount_from", { symbol: fromSymbol }),
					value: formatBigInt(amount, Number(fromDecimals)) + " " + fromSymbol,
				},
				{
					title: t("swap.swap_tx.amount_to", { symbol: toSymbol }),
					value: formatBigInt(amount, Number(fromDecimals)) + " " + toSymbol,
				},
				{
					title: t("common.txs.transaction"),
					hash: burnWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: burnWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("swap.swap_tx.title", { fromSymbol, toSymbol })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("swap.swap_tx.success", { fromSymbol, toSymbol })} rows={toastContent} />,
				},
			});
			swapStats.refetch();
			setAmount(0n);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: need to translate
		} finally {
			setTxOnGoing(false);
		}
	};

	const handleOpenModal = (side: TokenInteractionSide) => {
		setInteractionSide(side);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setInteractionSide(undefined);
	};

	const handleSelectToken = (symbol: string) => {		
		if(interactionSide === TokenInteractionSide.INPUT) {
			onSetFromSymbol(symbol);
		} else {
			onSetToSymbol(symbol);
		}

		handleCloseModal();
	};

	const fromTokenMeta = getTokenMetaBySymbol(fromSymbol);
	const toTokenMeta = getTokenMetaBySymbol(toSymbol);
	const stablecoinMeta = getTokenMetaBySymbol(getSelectedStablecoinSymbol());
	const limit = fromSymbol === TOKEN_SYMBOL ? stablecoinMeta.bridgeBal : stablecoinMeta.remaining;
	const rebasedOutputAmount = rebaseDecimals(amount, fromTokenMeta.decimals, toTokenMeta.decimals);

	return (
		<>
			<Head>
				<title>dEURO - {t("swap.swap")}</title>
			</Head>

			<div className="md:mt-8 flex justify-center">
				<div className="max-w-lg w-[32rem]">
					<AppCard className="w-full p-4 flex flex-col gap-8">
						<div className="w-full self-stretch justify-center items-center gap-1.5 inline-flex">
							<div className="text-text-title text-center text-lg sm:text-xl font-black ">
								{t("swap.title", { symbol: TOKEN_SYMBOL })}
							</div>
						</div>

						<div className="">
							<InputTitle>{t("common.send")}</InputTitle>
							<TokenInputSelectOutlined
								selectedToken={{
									symbol: fromTokenMeta.symbol,
									name: fromTokenMeta.symbol,
									address: fromTokenMeta.contractAddress as `0x${string}`,
									decimals: Number(fromTokenMeta.decimals),
								}}
								onSelectTokenClick={() => handleOpenModal(TokenInteractionSide.INPUT)}
								value={amount.toString()}
								onChange={onChangeAmount}
								isError={Boolean(error)}
								errorMessage={error}
								label={
									t("swap.limit_label") +
									" " +
									formatBigInt(limit, Number(toTokenMeta.decimals)) +
									" " +
									fromTokenMeta.symbol
								}
								adornamentRow={
									<div className="self-stretch justify-start items-center inline-flex">
										<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
											<div className="text-text-muted3 text-xs font-medium leading-none">
												€{formatCurrency(formatUnits(amount, Number(fromTokenMeta.decimals)), 2, 2)}
											</div>
											<div className="h-4 w-0.5 border-l border-input-placeholder"></div>
											<div className="text-text-muted3 text-xs font-medium leading-none">
												$
												{formatCurrency(
													Number(formatUnits(amount, Number(fromTokenMeta.decimals))) * (eurPrice as number),
													2,
													2
												)}
											</div>
										</div>
										<div className="h-7 justify-end items-center gap-2.5 flex">
											<div className="text-text-muted3 text-xs font-medium leading-none">
												{t("common.balance_label")} {" "}
												{formatCurrency(
													formatUnits(fromTokenMeta.userBal || 0n, Number(fromTokenMeta.decimals)),
													2,
													2
												)}{" "}
												{fromTokenMeta.symbol}
											</div>
											<MaxButton
												disabled={BigInt(fromTokenMeta.userBal) === BigInt(0)}
												onClick={() => onChangeAmount(fromTokenMeta.userBal.toString())}
											/>
										</div>
									</div>
								}
							/>

							<div className="pt-11 text-center z-0">
								<Button className={`h-10 rounded-full`} width="w-10" onClick={onChangeDirection}>
									<FontAwesomeIcon icon={faArrowDown} className="w-6 h-6" />
								</Button>
							</div>

							<InputTitle>{t("common.receive")}</InputTitle>
							<TokenInputSelectOutlined
								notEditable
								selectedToken={{
									symbol: toTokenMeta.symbol,
									name: toTokenMeta.symbol,
									address: toTokenMeta.contractAddress as `0x${string}`,
									decimals: Number(toTokenMeta.decimals),
								}}
								onSelectTokenClick={() => handleOpenModal(TokenInteractionSide.OUTPUT)}
								value={rebasedOutputAmount.toString()}
								onChange={() => {}}
								adornamentRow={
									<div className="self-stretch justify-start items-center inline-flex">
										<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
											<div className="text-text-muted3 text-xs font-medium leading-none">
												€{formatCurrency(formatUnits(BigInt(rebasedOutputAmount), Number(toTokenMeta.decimals)), 2, 2)}
											</div>

											<div className="h-4 w-0.5 border-l border-input-placeholder"></div>
											<div className="text-text-muted3 text-xs font-medium leading-none">
												$
												{formatCurrency(
													Number(formatUnits(BigInt(rebasedOutputAmount), Number(toTokenMeta.decimals))) *
														(eurPrice as number)
												)}
											</div>
										</div>
										<div className="h-7 justify-end items-center gap-2.5 flex">
											<div className="text-text-muted3 text-xs font-medium leading-none">
												{t("common.balance_label")} {" "}
												{formatCurrency(formatUnits(toTokenMeta.userBal || 0n, Number(toTokenMeta.decimals)), 2, 2)}{" "}
												{toTokenMeta.symbol}
											</div>
											<MaxButton
												disabled={BigInt(toTokenMeta.userBal) === BigInt(0)}
												onClick={() =>
													onChangeAmount(
														rebaseDecimals(
															toTokenMeta.userBal,
															toTokenMeta.decimals,
															fromTokenMeta.decimals
														).toString()
													)
												}
											/>
										</div>
									</div>
								}
							/>
							<div className="mx-auto mt-12 max-w-full flex-col">
								<GuardToAllowedChainBtn>
									{amount > fromTokenMeta.userAllowance ? (
										<Button isLoading={isTxOnGoing} onClick={() => handleApprove()}>
											{t("common.approve")}
										</Button>
									) : fromSymbol === TOKEN_SYMBOL ? (
										<Button disabled={amount == 0n || !!error} isLoading={isTxOnGoing} onClick={() => handleBurn()}>
											{t("swap.swap")}
										</Button>
									) : (
										<Button disabled={amount == 0n || !!error} isLoading={isTxOnGoing} onClick={() => handleMint()}>
											{t("swap.swap")}
										</Button>
									)}
								</GuardToAllowedChainBtn>
							</div>
						</div>
					</AppCard>
				</div>
			</div>
			<TokenSelectModal title={t("swap.select_stablecoin")} isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
				<div className="h-full">
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.eurc.symbol}
						price={formatCurrency(formatUnits(swapStats.eurc.userBal, Number(swapStats.eurc.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.eurc.userBal, Number(swapStats.eurc.decimals))) as string}
						name={swapStats.eurc.symbol}
						onClick={() => handleSelectToken(swapStats.eurc.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.veur.symbol}
						price={formatCurrency(formatUnits(swapStats.veur.userBal, Number(swapStats.veur.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.veur.userBal, Number(swapStats.veur.decimals))) as string}
						name={swapStats.veur.symbol}
						onClick={() => handleSelectToken(swapStats.veur.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.eurs.symbol}
						price={formatCurrency(formatUnits(swapStats.eurs.userBal, Number(swapStats.eurs.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.eurs.userBal, Number(swapStats.eurs.decimals))) as string}
						name={swapStats.eurs.symbol}
						onClick={() => handleSelectToken(swapStats.eurs.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.eurr.symbol}
						price={formatCurrency(formatUnits(swapStats.eurr.userBal, Number(swapStats.eurr.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.eurr.userBal, Number(swapStats.eurr.decimals))) as string}
						name={swapStats.eurr.symbol}
						onClick={() => handleSelectToken(swapStats.eurr.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.europ.symbol}
						price={formatCurrency(formatUnits(swapStats.europ.userBal, Number(swapStats.europ.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.europ.userBal, Number(swapStats.europ.decimals))) as string}
						name={swapStats.europ.symbol}
						onClick={() => handleSelectToken(swapStats.europ.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.euri.symbol}
						price={formatCurrency(formatUnits(swapStats.euri.userBal, Number(swapStats.euri.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.euri.userBal, Number(swapStats.euri.decimals))) as string}
						name={swapStats.euri.symbol}
						onClick={() => handleSelectToken(swapStats.euri.symbol)}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.eure.symbol}
						price={formatCurrency(formatUnits(swapStats.eure.userBal, Number(swapStats.eure.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.eure.userBal, Number(swapStats.eure.decimals))) as string}
						name={swapStats.eure.symbol}
						onClick={() => handleSelectToken(swapStats.eure.symbol.toUpperCase())}
					/>
					<TokenModalRowButton
						currency="€"
						symbol={swapStats.eura.symbol}
						price={formatCurrency(formatUnits(swapStats.eura.userBal, Number(swapStats.eura.decimals)), 2, 2) as string}
						balance={formatCurrency(formatUnits(swapStats.eura.userBal, Number(swapStats.eura.decimals))) as string}
						name={swapStats.eura.symbol}
						onClick={() => handleSelectToken(swapStats.eura.symbol)}
					/>
				</div>
			</TokenSelectModal>
		</>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}
