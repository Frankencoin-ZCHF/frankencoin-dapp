import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Address, erc20Abi, formatUnits, maxUint256, TransactionReceipt, Log, decodeEventLog, zeroAddress } from "viem";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import AppCard from "@components/AppCard";
import Button from "@components/Button";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { SliderInputOutlined } from "@components/Input/SliderInputOutlined";
import { DetailsExpandablePanel } from "@components/PageMint/DetailsExpandablePanel";
import { NormalInputOutlined } from "@components/Input/NormalInputOutlined";
import { PositionQuery } from "@deuro/api";
import { SelectCollateralModal } from "./SelectCollateralModal";
import { BorrowingDEUROModal } from "@components/PageMint/BorrowingDEUROModal";
import { InputTitle } from "@components/Input/InputTitle";
import { formatBigInt, formatCurrency, shortenAddress, toDate, TOKEN_SYMBOL, toTimestamp, WHITELISTED_POSITIONS } from "@utils";
import { TokenBalance, useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { RootState, store } from "../../redux/redux.store";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { useTranslation } from "next-i18next";
import { ADDRESS, MintingHubGatewayABI, PositionV2ABI } from "@deuro/eurocoin";
import { useAccount, useBlock, useChainId } from "wagmi";
import { WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import { renderErrorTxToast } from "@components/TxToast";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import {
	LoanDetails,
	getLoanDetailsByCollateralAndYouGetAmount,
	getLoanDetailsByCollateralAndStartingLiqPrice,
} from "../../utils/loanCalculations";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { MaxButton } from "@components/Input/MaxButton";
import { useRouter } from "next/router";
import Link from "next/link";

export default function PositionCreate({}) {
	const [selectedCollateral, setSelectedCollateral] = useState<TokenBalance | null | undefined>(null);
	const [selectedPosition, setSelectedPosition] = useState<PositionQuery | null | undefined>(null);
	const [expirationDate, setExpirationDate] = useState<Date | undefined | null>(undefined);
	const [collateralAmount, setCollateralAmount] = useState("0");
	const [liquidationPrice, setLiquidationPrice] = useState("0");
	const [borrowedAmount, setBorrowedAmount] = useState("0");
	const [isOpenTokenSelector, setIsOpenTokenSelector] = useState(false);
	const [isOpenBorrowingDEUROModal, setIsOpenBorrowingDEUROModal] = useState(false);
	const [loanDetails, setLoanDetails] = useState<LoanDetails | undefined>(undefined);
	const [isApproving, setIsApproving] = useState(false);
	const [isCloneSuccess, setIsCloneSuccess] = useState(false);
	const [isCloneLoading, setIsCloneLoading] = useState(false);
	const [collateralError, setCollateralError] = useState("");

	const positions = useSelector((state: RootState) => state.positions.list?.list || []);
	const challenges = useSelector((state: RootState) => state.challenges.list?.list || []);
	const challengedPositions = (challenges || []).filter((c) => c.status === "Active").map((c) => c.position);

	const { data: latestBlock } = useBlock();
	const chainId = useChainId();
	const { address } = useAccount();
	const router = useRouter();
	const { query } = router;

	const elegiblePositions = useMemo(() => {
		const blockTimestamp = latestBlock?.timestamp || new Date().getTime() / 1000;
		return positions
			.filter((p) => WHITELISTED_POSITIONS.includes(p.position))
			.filter((p) => BigInt(p.availableForClones) > 0n)
			.filter((p) => !p.closed)
			.filter((p) => blockTimestamp > toTimestamp(toDate(p.cooldown)))
			.filter((p) => blockTimestamp < toTimestamp(toDate(p.expiration)))
			.filter((p) => !challengedPositions.includes(p.position));
	}, [positions, latestBlock, challengedPositions]);

	const collateralTokenList = useMemo(() => {
		const uniqueTokens = new Map();
		elegiblePositions.forEach((p) => {
			uniqueTokens.set(p.collateral.toLowerCase(), {
				symbol: p.collateralSymbol,
				address: p.collateral,
				name: p.collateralName,
				allowance: [ADDRESS[chainId].mintingHubGateway],
				decimals: p.collateralDecimals,
				position: p.position,
			});
		});
		return Array.from(uniqueTokens.values()).sort((a, b) => {
			const posA = WHITELISTED_POSITIONS.findIndex((p) => p.toLowerCase() === a.position.toLowerCase());
			const posB = WHITELISTED_POSITIONS.findIndex((p) => p.toLowerCase() === b.position.toLowerCase());
			if (posA === -1 || posB === -1) return 0;
			return posA - posB;
		});
	}, [elegiblePositions, isApproving]);

	const { balances, balancesByAddress, refetchBalances, isLoading: isLoadingBalances } = useWalletERC20Balances(collateralTokenList);
	const { frontendCode } = useFrontendCode();
	const { t } = useTranslation();

	// Handle initial selection from URL
	useEffect(() => {
		if (query && query.collateral && collateralTokenList.length > 0 && !selectedCollateral) {
			const queryCollateral = Array.isArray(query.collateral) ? query.collateral[0] : query.collateral;
			const collateralToken = collateralTokenList.find((b) => b.symbol.toLowerCase() === queryCollateral?.toLowerCase());
			if (collateralToken) {
				handleOnSelectedToken(collateralToken, isLoadingBalances);
			}
		}
	}, [query, collateralTokenList.length]);
	
	// Update amount when balances finish loading for URL-selected token
	const [hasSetInitialAmount, setHasSetInitialAmount] = useState(false);
	
	useEffect(() => {
		if (selectedCollateral && !isLoadingBalances && query?.collateral && selectedPosition && !hasSetInitialAmount) {
			const queryCollateral = Array.isArray(query.collateral) ? query.collateral[0] : query.collateral;
			if (selectedCollateral.symbol.toLowerCase() === queryCollateral?.toLowerCase()) {
				const tokenBalance = balancesByAddress[selectedCollateral.address]?.balanceOf || 0n;
				const minimumCollateral = BigInt(selectedPosition.minimumCollateral);
				const maxCollateralFromLimit = calculateMaxCollateralFromLimit(selectedPosition);
				
				// Determine the amount to set
				let amountToSet = minimumCollateral; // Start with minimum
				
				if (tokenBalance > 0n) {
					// Use the minimum between wallet balance and minting limit
					const cappedAmount = maxCollateralFromLimit > 0n && tokenBalance > maxCollateralFromLimit 
						? maxCollateralFromLimit 
						: tokenBalance;
					// Use the higher of minimum collateral or the capped amount
					amountToSet = cappedAmount > minimumCollateral ? cappedAmount : minimumCollateral;
				}
				
				setCollateralAmount(amountToSet.toString());
				setHasSetInitialAmount(true);
				
				// Set expiration date if not already set
				const dateToUse = expirationDate || toDate(selectedPosition.expiration);
				if (!expirationDate) {
					setExpirationDate(dateToUse);
				}
				
				// Recalculate loan details with the new amount
				const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
					selectedPosition,
					amountToSet,
					BigInt(selectedPosition.price),
					dateToUse
				);
				setLoanDetails(loanDetails);
				setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
			}
		}
	}, [isLoadingBalances, selectedCollateral, query, balancesByAddress, selectedPosition, hasSetInitialAmount]);

	// Collateral input validation
	useEffect(() => {
		if (!selectedPosition || !selectedCollateral) return;

		if (BigInt(collateralAmount) === 0n || collateralAmount === "" || !address) {
			setCollateralError("");
			return;
		}

		const balanceInWallet = balancesByAddress[selectedCollateral?.address];
		
		if (BigInt(collateralAmount) < BigInt(selectedPosition.minimumCollateral)) {
			const minColl = formatBigInt(BigInt(selectedPosition?.minimumCollateral || 0n), selectedPosition?.collateralDecimals || 0);
			const notTheMinimum = `${t("mint.error.must_be_at_least_the_minimum_amount")} (${minColl} ${
				selectedPosition?.collateralSymbol
			})`;
			setCollateralError(notTheMinimum);
		} else if (BigInt(collateralAmount) > BigInt(balanceInWallet?.balanceOf || 0n)) {
			const notEnoughBalance = t("common.error.insufficient_balance", { symbol: selectedPosition?.collateralSymbol });
			setCollateralError(notEnoughBalance);
		} else {
			setCollateralError("");
		}
	}, [collateralAmount, balancesByAddress, address, selectedPosition]);

	const prices = useSelector((state: RootState) => state.prices.coingecko || {});
	const eurPrice = useSelector((state: RootState) => state.prices.eur?.usd);
	const collateralPriceDeuro = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.eur || 0;

	const collateralPriceUsd = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.usd || 0;
	const collateralEurValue = selectedPosition
		? formatCurrency(
				collateralPriceDeuro * parseFloat(formatUnits(BigInt(collateralAmount), selectedPosition.collateralDecimals)),
				2,
				2
		  )
		: 0;
	const collateralUsdValue = selectedPosition
		? formatCurrency(collateralPriceUsd * parseFloat(formatUnits(BigInt(collateralAmount), selectedPosition.collateralDecimals)), 2, 2)
		: 0;
	const maxLiquidationPrice = selectedPosition ? BigInt(selectedPosition.price) : 0n;
	const isLiquidationPriceTooHigh = selectedPosition ? BigInt(liquidationPrice) > maxLiquidationPrice : false;
	const collateralUserBalance = balances.find((b) => b.address == selectedCollateral?.address);
	const userAllowance = collateralUserBalance?.allowance?.[ADDRESS[chainId].mintingHubGateway] || 0n;
	const userBalance = collateralUserBalance?.balanceOf || 0n;
	const isCollateralError =
		collateralAmount !== "0" && collateralAmount !== "" && BigInt(userBalance) < BigInt(selectedPosition?.minimumCollateral || 0n);
	const selectedBalance = Boolean(selectedCollateral) ? balancesByAddress[selectedCollateral?.address as Address] : null;
	
	// Helper function to calculate max collateral from minting limit
	const calculateMaxCollateralFromLimit = (position: typeof selectedPosition) => {
		if (!position) return 0n;
		const availableForClones = BigInt(position.availableForClones);
		const liqPrice = BigInt(position.price);
		
		// Calculate max collateral that respects the global minting limit
		// availableForClones is the max LOAN amount
		// Formula: collateral = loanAmount * 1e18 / price
		return liqPrice > 0n 
			? (availableForClones * BigInt(1e18)) / liqPrice
			: BigInt(0);
	};
	
	// Calculate the maximum collateral amount respecting the global minting limit
	const calculateMaxCollateral = () => {
		if (!selectedPosition || !selectedBalance) return 0n;
		const tokenBalance = selectedBalance.balanceOf || 0n;
		const maxCollateralFromLimit = calculateMaxCollateralFromLimit(selectedPosition);
		
		// For the MAX button, use the minimum of wallet balance and minting limit
		// This ensures the MAX button respects the limit
		let maxAmount = tokenBalance;
		if (maxCollateralFromLimit > 0n && maxCollateralFromLimit < tokenBalance) {
			maxAmount = maxCollateralFromLimit;
		}
		
		return maxAmount;
	};
	
	const maxCollateralAmount = calculateMaxCollateral();
	
	// Check if minting limit is reached
	const isMintingLimitReached = () => {
		if (!selectedPosition || !selectedBalance) return false;
		const tokenBalance = selectedBalance.balanceOf || 0n;
		const availableForClones = BigInt(selectedPosition.availableForClones);
		
		if (availableForClones === 0n) return true;
		
		const maxCollateralFromLimit = calculateMaxCollateralFromLimit(selectedPosition);
		return tokenBalance > maxCollateralFromLimit && maxCollateralFromLimit > 0n;
	};
	
	const mintingLimitReached = isMintingLimitReached();
	
	// Check if current collateral amount exceeds minting limit
	const isCollateralExceedingLimit = () => {
		if (!selectedPosition || !collateralAmount) return false;
		const maxCollateralFromLimit = calculateMaxCollateralFromLimit(selectedPosition);
		return maxCollateralFromLimit > 0n && BigInt(collateralAmount) > maxCollateralFromLimit;
	};
	
	const collateralExceedsLimit = isCollateralExceedingLimit();
	
	const usdLiquidationPrice = formatCurrency(
		parseFloat(formatUnits(BigInt(liquidationPrice), 36 - (selectedPosition?.collateralDecimals || 0))) * (eurPrice || 0),
		2,
		2
	)?.toString();

	const handleOnSelectedToken = (token: TokenBalance, balancesLoading?: boolean) => {
		if (!token) return;
		setSelectedCollateral(token);
		setHasSetInitialAmount(false); // Reset the flag when changing tokens
		const currentQuery = { ...router.query, collateral: token.symbol };
		router.replace({
			pathname: router.pathname,
			query: currentQuery,
		});

		const selectedPosition = elegiblePositions.find((p) => p.collateral.toLowerCase() == token.address.toLowerCase());
		if (!selectedPosition) return;
		const liqPrice = BigInt(selectedPosition.price);

		setSelectedPosition(selectedPosition);
		
		// Calculate max collateral based on availableForClones limit
		const tokenBalance = balancesByAddress[token.address]?.balanceOf || 0n;
		const maxCollateralFromLimit = calculateMaxCollateralFromLimit(selectedPosition);
		
		// Set the default amount based on loading state and limits
		const minimumCollateral = BigInt(selectedPosition.minimumCollateral);
		let defaultAmount = minimumCollateral; // Start with minimum
		
		if (!balancesLoading && tokenBalance > 0n) {
			// Use the minimum between wallet balance and minting limit
			const cappedAmount = maxCollateralFromLimit > 0n && tokenBalance > maxCollateralFromLimit 
				? maxCollateralFromLimit 
				: tokenBalance;
			// Use the higher of minimum collateral or the capped amount
			defaultAmount = cappedAmount > minimumCollateral ? cappedAmount : minimumCollateral;
		}
		
		const newExpirationDate = toDate(selectedPosition.expiration);
		setCollateralAmount(defaultAmount.toString());
		setExpirationDate(newExpirationDate);
		setLiquidationPrice(liqPrice.toString());

		const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
			selectedPosition,
			defaultAmount,
			liqPrice,
			newExpirationDate
		);

		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onAmountCollateralChange = (value: string) => {
		setCollateralAmount(value);
		if (!selectedPosition) return;
		
		// Handle empty or zero values
		if (!value || value === "") {
			setLoanDetails(undefined);
			setBorrowedAmount("0");
			return;
		}

		try {
			const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
				selectedPosition, 
				BigInt(value), 
				BigInt(liquidationPrice),
				expirationDate || toDate(selectedPosition.expiration)
			);
			setLoanDetails(loanDetails);
			setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
		} catch (error) {
			// Handle invalid BigInt conversion
			console.error("Error calculating loan details:", error);
		}
	};

	const onLiquidationPriceChange = (value: string) => {
		setLiquidationPrice(value);

		if (!selectedPosition) return;
		if (!collateralAmount || collateralAmount === "" || collateralAmount === "0") return;

		try {
			const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
				selectedPosition, 
				BigInt(collateralAmount), 
				BigInt(value),
				expirationDate || toDate(selectedPosition.expiration)
			);
			
			setLoanDetails(loanDetails);
			setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
		} catch (error) {
			console.error("Error updating loan amount:", error);
		}
	};

	const onYouGetChange = (value: string) => {
		setBorrowedAmount(value);

		if (!selectedPosition) return;

		const loanDetails = getLoanDetailsByCollateralAndYouGetAmount(selectedPosition, BigInt(collateralAmount), BigInt(value), expirationDate || toDate(selectedPosition.expiration));
		setLoanDetails(loanDetails);
		setLiquidationPrice(loanDetails.startingLiquidationPrice.toString());
	};

	const handleMaxExpirationDate = () => {
		if (selectedPosition?.expiration) {
			const maxDate = toDate(selectedPosition.expiration);
			setExpirationDate(maxDate);
			// Recalculate loan details with new expiration date
			if (collateralAmount && liquidationPrice) {
				try {
					const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
						selectedPosition,
						BigInt(collateralAmount),
						BigInt(liquidationPrice),
						maxDate
					);
					setLoanDetails(loanDetails);
					setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
				} catch (error) {
					// Handle error
				}
			}
		}
	};
	
	const handleExpirationDateChange = (date: Date | null) => {
		setExpirationDate(date);
		// Recalculate loan details with new expiration date
		if (selectedPosition && collateralAmount && liquidationPrice && date) {
			try {
				const loanDetails = getLoanDetailsByCollateralAndStartingLiqPrice(
					selectedPosition,
					BigInt(collateralAmount),
					BigInt(liquidationPrice),
					date
				);
				setLoanDetails(loanDetails);
				setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
			} catch (error) {
				// Handle error
			}
		}
	};

	const handleOnClonePosition = async () => {
		try {
			if (!selectedPosition || !loanDetails || !expirationDate) return;

			setIsOpenBorrowingDEUROModal(true);
			setIsCloneLoading(true);
			setIsCloneSuccess(false);

			let txHash = null;

			const cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubGatewayABI,
				functionName: "clone",
				args: [
					selectedPosition.position,
					BigInt(collateralAmount),
					loanDetails.loanAmount,
					toTimestamp(expirationDate),
					frontendCode,
				],
			});
			txHash = cloneWriteHash;

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(loanDetails.loanAmount) + ` ${TOKEN_SYMBOL}`,
				},
				{
					title: t("common.txs.collateral"),
					value:
						formatBigInt(BigInt(collateralAmount), selectedPosition.collateralDecimals) +
						" " +
						selectedPosition.collateralSymbol,
				},
				{
					title: t("common.txs.transaction"),
					hash: cloneWriteHash,
				},
			];

			const receipt: TransactionReceipt = await waitForTransactionReceipt(WAGMI_CONFIG, { hash: cloneWriteHash, confirmations: 1 });

			if (BigInt(liquidationPrice) !== BigInt(selectedPosition?.price)) {
				const newPositionAddress = parseCloneEventLogs(receipt.logs);
				const adjustPriceHash = await writeContract(WAGMI_CONFIG, {
					address: newPositionAddress as Address,
					abi: PositionV2ABI,
					functionName: "adjustPrice",
					args: [(BigInt(liquidationPrice) * 10001n) / 10000n], // added 0.001% to account for interest in the block before signing this
				});
				txHash = adjustPriceHash;
			}

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: txHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.minting", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.minting_success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			store.dispatch(fetchPositionsList());
			setIsCloneSuccess(true);
			await refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
			setIsOpenBorrowingDEUROModal(false);
		} finally {
			setIsCloneLoading(false);
			refetchBalances();
		}
	};

	const parseCloneEventLogs = (logs: Log[]) => {
		try {
			const cloneEventLog = logs.find((log) => log.address.toLowerCase() === ADDRESS[chainId].mintingHubGateway.toLowerCase());

			if (cloneEventLog) {
				const decodedLog = decodeEventLog({
					abi: MintingHubGatewayABI,
					data: cloneEventLog.data,
					topics: cloneEventLog.topics,
				});

				if (decodedLog.eventName === "PositionOpened") {
					return decodedLog.args.position as Address;
				}
			}

			return null;
		} catch (error) {
			return null;
		}
	};

	const handleApprove = async () => {
		try {
			setIsApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: selectedCollateral?.address as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].mintingHubGateway, BigInt(collateralAmount)],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatCurrency(formatUnits(BigInt(collateralAmount), selectedCollateral?.decimals || 18)) + " " + selectedCollateral?.symbol,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].mintingHubGateway),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setIsApproving(false);
			refetchBalances();
		}
	};

	return (
		<div className="md:mt-8 flex justify-center">
			<div className="max-w-lg w-[32rem]">
				<AppCard className="w-full p-4 flex-col justify-start items-center gap-8 flex">
					<div className="self-stretch justify-center items-center gap-1.5 inline-flex">
						<div className="text-text-title text-xl font-black ">{t("mint.mint_title_2", { symbol: TOKEN_SYMBOL })}</div>
					</div>
					<div className="self-stretch flex-col justify-start items-center gap-1 flex">
						<InputTitle icon={faCircleQuestion}>{t("mint.select_collateral")}</InputTitle>
						<TokenInputSelectOutlined
							selectedToken={selectedCollateral}
							onSelectTokenClick={() => setIsOpenTokenSelector(true)}
							value={collateralAmount}
							onChange={onAmountCollateralChange}
							isError={Boolean(collateralError)}
							errorMessage={collateralError}
							adornamentRow={
								<div className="self-stretch justify-start items-center inline-flex">
									<div className="grow shrink basis-0 h-4 px-2 justify-start items-center gap-2 flex max-w-full overflow-hidden">
										<div className="text-input-label text-xs font-medium leading-none">€{collateralEurValue}</div>
										<div className="h-4 w-0.5 border-l border-input-placeholder"></div>
										<div className="text-input-label text-xs font-medium leading-none">${collateralUsdValue}</div>
									</div>
									<div className="h-7 justify-end items-center gap-2.5 flex">
										{selectedBalance && (
											<>
												<div className="text-input-label text-xs font-medium leading-none">
													{formatCurrency(formatUnits(maxCollateralAmount, selectedBalance.decimals || 18), 2, 2)}{" "}
													{selectedBalance.symbol}
												</div>
												<MaxButton
													disabled={BigInt(selectedBalance.balanceOf || 0n) === BigInt(0)}
													onClick={() => onAmountCollateralChange(maxCollateralAmount.toString())}
												/>
											</>
										)}
									</div>
								</div>
							}
						/>
						{mintingLimitReached && selectedPosition && (
							<div className="self-stretch px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
								<div className="text-yellow-800 text-sm font-medium">
									⚠️ Global minting limit reached. Maximum {formatCurrency(formatUnits(BigInt(selectedPosition.availableForClones), 18), 2, 2)} {TOKEN_SYMBOL} can be minted.
								</div>
								<div className="text-yellow-700 text-xs mt-1">
									Maximum collateral: {formatCurrency(formatUnits(maxCollateralAmount, selectedPosition.collateralDecimals), 2, 2)} {selectedPosition.collateralSymbol}
								</div>
							</div>
						)}
						<SelectCollateralModal
							title={t("mint.token_select_modal_title")}
							isOpen={isOpenTokenSelector}
							setIsOpen={setIsOpenTokenSelector}
							options={balances}
							onTokenSelect={(token) => handleOnSelectedToken(token, isLoadingBalances)}
						/>
					</div>
					<div className="self-stretch flex-col justify-start items-center gap-1 flex">
						<InputTitle icon={faCircleQuestion}>{t("mint.select_liquidation_price")}</InputTitle>
						<SliderInputOutlined
							value={liquidationPrice}
							onChange={onLiquidationPriceChange}
							min={BigInt(0)}
							max={maxLiquidationPrice}
							decimals={36 - (selectedPosition?.collateralDecimals || 0)}
							isError={isLiquidationPriceTooHigh}
							errorMessage={t("mint.liquidation_price_too_high")}
							usdPrice={usdLiquidationPrice}
						/>
					</div>
					<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
						<InputTitle>{t("mint.set_expiration_date")}</InputTitle>
						<DateInputOutlined
							value={expirationDate}
							maxDate={selectedPosition?.expiration ? toDate(selectedPosition?.expiration) : expirationDate}
							placeholderText="YYYY-MM-DD"
							onChange={handleExpirationDateChange}
							rightAdornment={expirationDate ? <MaxButton onClick={handleMaxExpirationDate} /> : null}
						/>
						<div className="self-stretch text-xs font-medium leading-normal">{t("mint.expiration_date_description")}</div>
					</div>
					<div className="self-stretch flex-col justify-start items-start gap-4 flex">
						<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
							<InputTitle>{t("mint.you_get")}</InputTitle>
							<NormalInputOutlined value={borrowedAmount} onChange={onYouGetChange} decimals={18} />
						</div>
						<DetailsExpandablePanel
							loanDetails={loanDetails}
							startingLiquidationPrice={BigInt(liquidationPrice)}
							collateralDecimals={selectedPosition?.collateralDecimals || 0}
							collateralPriceDeuro={collateralPriceDeuro}
							extraRows={
								<div className="py-1.5 flex justify-between">
									<span className="text-base leading-tight">{t("mint.original_position")}</span>
									<Link
										className="underline text-right text-sm font-extrabold leading-none tracking-tight"
										href={`/monitoring/${selectedPosition?.position}`}
									>
										{shortenAddress(selectedPosition?.position || zeroAddress)}
									</Link>
								</div>
							}
						/>
					</div>
					<GuardToAllowedChainBtn label={t("mint.symbol_borrow", { symbol: TOKEN_SYMBOL })}>
						{!selectedCollateral ? (
							<Button
								className="!p-4 text-lg font-extrabold leading-none"
								onClick={handleOnClonePosition}
								disabled={!selectedPosition || !selectedCollateral || isLiquidationPriceTooHigh}
							>
								{t("common.receive") + " 0.00 " + TOKEN_SYMBOL}
							</Button>
						) : userAllowance >= BigInt(collateralAmount) ? (
							<Button
								className="!p-4 text-lg font-extrabold leading-none"
								onClick={handleOnClonePosition}
								disabled={
									!selectedPosition ||
									!selectedCollateral ||
									isLiquidationPriceTooHigh ||
									isCollateralError ||
									Boolean(collateralError) ||
									userBalance < BigInt(collateralAmount) ||
									collateralExceedsLimit
								}
							>
								{isLiquidationPriceTooHigh
									? t("mint.your_liquidation_price_is_too_high")
									: t("common.receive") + " " + formatCurrency(formatUnits(BigInt(borrowedAmount), 18), 2)}
							</Button>
						) : (
							<Button className="!p-4 text-lg font-extrabold leading-none" onClick={handleApprove} isLoading={isApproving}>
								{t("common.approve")}
							</Button>
						)}
					</GuardToAllowedChainBtn>
					<BorrowingDEUROModal
						isOpen={isOpenBorrowingDEUROModal}
						setIsOpen={setIsOpenBorrowingDEUROModal}
						youGet={formatCurrency(formatUnits(BigInt(borrowedAmount), 18), 2)}
						liquidationPrice={formatCurrency(
							formatUnits(BigInt(liquidationPrice), 36 - (selectedPosition?.collateralDecimals || 0)),
							2
						)}
						expiration={expirationDate}
						formmatedCollateral={`${formatUnits(BigInt(collateralAmount), selectedPosition?.collateralDecimals || 0)} ${
							selectedPosition?.collateralSymbol
						}`}
						collateralPriceDeuro={collateralEurValue || "0"}
						isSuccess={isCloneSuccess}
						isLoading={isCloneLoading}
						usdLiquidationPrice={usdLiquidationPrice}
					/>
				</AppCard>
			</div>
		</div>
	);
}
