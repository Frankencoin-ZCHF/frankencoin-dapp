import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Address, erc20Abi, formatUnits, maxUint256, TransactionReceipt, Log, decodeEventLog } from "viem";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import AppCard from "@components/AppCard";
import Button from "@components/Button";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { SliderInputOutlined } from "@components/Input/SliderInputOutlined";
import { DetailsExpandablePanel } from "@components/DetailsExpandablePanel";
import { NormalInputOutlined } from "@components/Input/NormalInputOutlined";
import { PositionQuery } from "@deuro/api";
import { TokenSelectModal } from "@components/TokenSelectModal";
import { BorrowingDEUROModal } from "@components/PageMint/BorrowingDEUROModal";
import { InputTitle } from "@components/Input/InputTitle";
import { formatBigInt, formatCurrency, shortenAddress, toDate, TOKEN_SYMBOL, toTimestamp } from "@utils";
import { TokenBalance, useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { RootState, store } from "../../redux/redux.store";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { useTranslation } from "next-i18next";
import { ADDRESS, MintingHubGatewayABI, PositionV2ABI } from "@deuro/eurocoin";
import { useBlock, useChainId } from "wagmi";
import { WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import { renderErrorTxToast } from "@components/TxToast";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import {
	LoanDetails,
	getLoanDetailsByCollateralAndYouGetAmount,
	getLoanDetailsByCollateralAndLiqPrice,
} from "../../utils/loanCalculations";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { MaxButton } from "@components/Input/MaxButton";
import { useRouter } from "next/router";

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

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const challengedPositions = challenges.filter((c) => c.status === "Active").map((c) => c.position);

	const { data: latestBlock } = useBlock();
	const chainId = useChainId();
	const { query } = useRouter();

	const elegiblePositions = useMemo(() => {
		const blockTimestamp = latestBlock?.timestamp || new Date().getTime()/1000;
		return positions
			.filter((p) => BigInt(p.availableForClones) > 0n)
			.filter((p) => blockTimestamp > toTimestamp(toDate(p.cooldown)))
			.filter((p) => blockTimestamp < toTimestamp(toDate(p.expiration)))
			.filter((p) => !challengedPositions.includes(p.position));
	}, [positions, latestBlock, challengedPositions]);

	const collateralTokenList = useMemo(() => {
		const uniqueTokens = new Map();
		elegiblePositions
			.forEach((p) => {
				uniqueTokens.set(p.collateral.toLowerCase(), {
					symbol: p.collateralSymbol,
					address: p.collateral,
					name: p.collateralName,
					allowance: [ADDRESS[chainId].mintingHubGateway],
				});
			});
		return Array.from(uniqueTokens.values());
	}, [elegiblePositions, isApproving]);

	const { balances, refetchBalances } = useWalletERC20Balances(collateralTokenList);
	const { frontendCode } = useFrontendCode();
	const { t } = useTranslation();

	useEffect(() => {
		if (query && query.collateral) {
			const queryCollateral = Array.isArray(query.collateral) ? query.collateral[0] : query.collateral;
			const collateralToken = collateralTokenList.find((b) => b.symbol.toLowerCase() === queryCollateral?.toLowerCase());
			if (collateralToken) {
				handleOnSelectedToken(collateralToken);
			}
		}
	}, []);

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collateralPriceDeuro = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.usd || 0; // TODO: change to eur?

	const collateralPriceUsd = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.usd || 0;	
	const decimalsAdjustment = selectedPosition?.collateralDecimals === 0 ? 18 : (selectedPosition?.collateralDecimals as number);
	const collateralEurValue = selectedPosition
		? collateralPriceDeuro * parseFloat(formatUnits(BigInt(collateralAmount), decimalsAdjustment))
		: 0;
	const collateralUsdValue = selectedPosition
		? collateralPriceUsd * parseFloat(formatUnits(BigInt(collateralAmount), decimalsAdjustment))
		: 0;
	const maxLiquidationPrice = selectedPosition ? BigInt(selectedPosition.price) : 0n;
	const isLiquidationPriceTooHigh = selectedPosition ? BigInt(liquidationPrice) >= maxLiquidationPrice : false;
	const userAllowance =
		balances.find((b) => b.address == selectedCollateral?.address)?.allowance?.[ADDRESS[chainId].mintingHubGateway] || 0n;
	const isCollateralError = collateralAmount !== "0" && collateralAmount !== "" && BigInt(collateralAmount) < BigInt(selectedPosition?.minimumCollateral || 0n);

	const handleOnSelectedToken = (token: TokenBalance) => {
		if (!token) return;
		setSelectedCollateral(token);

		const selectedPosition = elegiblePositions
			.find((p) => p.collateral.toLowerCase() == token.address.toLowerCase());
		if (!selectedPosition) return;

		const liqPrice = BigInt(selectedPosition.price) / 2n;

		setSelectedPosition(selectedPosition);
		setCollateralAmount(selectedPosition.minimumCollateral);
		setExpirationDate(toDate(selectedPosition.expiration));
		setLiquidationPrice(liqPrice.toString());

		const loanDetails = getLoanDetailsByCollateralAndLiqPrice(
			selectedPosition,
			BigInt(selectedPosition.minimumCollateral),
			liqPrice,
		);

		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onAmountCollateralChange = (value: string) => {
		setCollateralAmount(value);
		if (!selectedPosition) return;

		const loanDetails = getLoanDetailsByCollateralAndLiqPrice(selectedPosition, BigInt(value), BigInt(liquidationPrice));
		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onLiquidationPriceChange = (value: string) => {
		setLiquidationPrice(value);

		if (!selectedPosition) return;

		const loanDetails = getLoanDetailsByCollateralAndLiqPrice(
			selectedPosition,
			BigInt(collateralAmount),
			BigInt(value),
		);
		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onYouGetChange = (value: string) => {
		setBorrowedAmount(value);

		if (!selectedPosition) return;

		const loanDetails = getLoanDetailsByCollateralAndYouGetAmount(selectedPosition, BigInt(collateralAmount), BigInt(value));
		setLoanDetails(loanDetails);
		setLiquidationPrice(loanDetails.liquidationPrice.toString());
	};

	const handleMaxExpirationDate = () => {
		if (selectedPosition?.expiration) {
			setExpirationDate(toDate(selectedPosition.expiration));
		}
	};

	const handleOnClonePosition = async () => {
		try {
			if (!selectedPosition || !loanDetails || !expirationDate) return;

			setIsOpenBorrowingDEUROModal(true);
			setIsCloneLoading(true);
			setIsCloneSuccess(false);

			const cloneWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubGateway,
				abi: MintingHubGatewayABI,
				functionName: "clone",
				args: [selectedPosition.position, BigInt(collateralAmount), loanDetails.loanAmount, toTimestamp(expirationDate), frontendCode],
			});

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
			const newPositionAddress = parseCloneEventLogs(receipt.logs);
			const adjustPriceHash = await writeContract(WAGMI_CONFIG, {
				address: newPositionAddress as Address,
				abi: PositionV2ABI,
				functionName: "adjustPrice",
				args: [BigInt(liquidationPrice)],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: adjustPriceHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.minting", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.minting_success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});

			store.dispatch(fetchPositionsList());
			setIsCloneSuccess(true);
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
			const cloneEventLog = logs.find(log => 
				log.address.toLowerCase() === ADDRESS[chainId].mintingHubGateway.toLowerCase()
			);
			
			if (cloneEventLog) {
				const decodedLog = decodeEventLog({
					abi: MintingHubGatewayABI,
					data: cloneEventLog.data,
					topics: cloneEventLog.topics,
				});
				
				if (decodedLog.eventName === 'PositionOpened') {
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
				args: [ADDRESS[chainId].mintingHubGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + selectedCollateral?.symbol,
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
			<AppCard className="max-w-lg p-4 flex-col justify-start items-center gap-8 inline-flex overflow-hidden">
				<div className="self-stretch justify-center items-center gap-1.5 inline-flex">
					<div className="text-text-title text-xl font-black ">
						{t("mint.symbol_borrow", { symbol: TOKEN_SYMBOL })}
					</div>
				</div>

				<div className="self-stretch flex-col justify-start items-center gap-1 flex">
					<InputTitle icon={faCircleQuestion}>{t("mint.select_collateral")}</InputTitle>
					<TokenInputSelectOutlined
						selectedToken={selectedCollateral}
						onSelectTokenClick={() => setIsOpenTokenSelector(true)}
						value={collateralAmount}
						onChange={onAmountCollateralChange}
						usdValue={collateralUsdValue}
						eurValue={collateralEurValue}
						isError={isCollateralError}
						errorMessage={`${t("mint.error.must_be_at_least_the_minimum_amount")} (${formatBigInt(BigInt(selectedPosition?.minimumCollateral || 0n))} ${selectedPosition?.collateralSymbol})`}
					/>
					<TokenSelectModal
						title={t("mint.token_select_modal_title")}
						isOpen={isOpenTokenSelector}
						setIsOpen={setIsOpenTokenSelector}
						options={balances}
						onTokenSelect={handleOnSelectedToken}
					/>
				</div>
				<div className="self-stretch flex-col justify-start items-center gap-1 flex">
					<InputTitle icon={faCircleQuestion}>{t("mint.select_liquidation_price")}</InputTitle>
					<SliderInputOutlined
						value={liquidationPrice}
						onChange={onLiquidationPriceChange}
						min={BigInt(0)}
						max={maxLiquidationPrice}
						decimals={selectedPosition?.collateralDecimals || 0}
						isError={isLiquidationPriceTooHigh}
						errorMessage={t("mint.liquidation_price_too_high")}
					/>
				</div>
				<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
					<InputTitle>{t("mint.set_expiration_date")}</InputTitle>
					<DateInputOutlined
						value={expirationDate}
						maxDate={expirationDate}
						placeholderText="YYYY-MM-DD"
						onChange={setExpirationDate}
						rightAdornment={expirationDate ? <MaxButton onClick={handleMaxExpirationDate} /> : null}
					/>
					<div className="self-stretch text-xs font-medium leading-normal">{t("mint.expiration_date_description")}</div>
				</div>
				<div className="self-stretch flex-col justify-start items-start gap-4 flex">
					<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
						<InputTitle>{t("mint.you_get")}</InputTitle>
						<NormalInputOutlined value={borrowedAmount} onChange={onYouGetChange} decimals={18} />
					</div>
					<DetailsExpandablePanel loanDetails={loanDetails} collateralPriceDeuro={collateralPriceDeuro} />
				</div>
				<GuardToAllowedChainBtn label={t("mint.symbol_borrow", { symbol: TOKEN_SYMBOL })}>
					{  !selectedCollateral ? (
						<Button
							className="!p-4 text-lg font-extrabold leading-none"
							onClick={handleOnClonePosition}
							disabled={!selectedPosition || !selectedCollateral || isLiquidationPriceTooHigh}
					>
						
							
								{ t("common.receive") + " 0.00 " + TOKEN_SYMBOL}
						</Button>
					) : userAllowance > BigInt(collateralAmount) ? (
						<Button
							className="!p-4 text-lg font-extrabold leading-none"
							onClick={handleOnClonePosition}
							disabled={!selectedPosition || !selectedCollateral || isLiquidationPriceTooHigh || isCollateralError}
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
					formmatedCollateral={`${formatUnits(BigInt(collateralAmount), 36 - (selectedPosition?.collateralDecimals || 0))} ${
						selectedPosition?.collateralSymbol
					}`}
					isSuccess={isCloneSuccess}
					isLoading={isCloneLoading}
				/>
			</AppCard>
		</div>
	);
}
