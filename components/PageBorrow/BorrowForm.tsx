import { useState } from "react";
import { useSelector } from "react-redux";
import { Address, formatUnits } from "viem";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import AppCard from "@components/AppCard";
import Button from "@components/Button";
import { TokenInputSelectOutlined } from "@components/Input/TokenInputSelectOutlined";
import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { SliderInputOutlined } from "@components/Input/SliderInputOutlined";
import { DetailsExpandablePanel } from "@components/PageBorrow/DetailsExpandablePanel";
import { NormalInputOutlined } from "@components/Input/NormalInputOutlined";
import { ApiPriceMapping, PositionQuery } from "@deuro/api";
import { TokenSelectModal } from "@components/TokenSelectModal";
import { BorrowingDEUROModal } from "@components/PageBorrow/BorrowingDEUROModal";
import { InputTitle } from "@components/Input/InputTitle";
import { formatCurrency, toDate } from "@utils";
import { TokenBalance, useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { RootState } from "../../redux/redux.store";

// TODO: remove fake data
import { LIST, TOKEN_OPTIONS, PRICES, MAX_LIQUIDATION_PRICE_DECREASE } from "./LIST";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";

type LoanDetails = {
	loanAmount: bigint;
	feePercent: bigint;
	fees: bigint;
	borrowersReserveContribution: bigint;
	amountToSendToWallet: bigint;
	requiredCollateral: bigint;
	originalPosition: `0x${string}`;
	effectiveInterest: number;
	effectiveLTV: number;
	collateralPriceDeuro: number;
};

const calculateLoanDetailsByCollateral = (position: PositionQuery, collateralAmount: bigint, collateralPriceDeuro: number): LoanDetails => {
	const { price, annualInterestPPM, reserveContribution, expiration, collateralDecimals, original } = position;

	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((toDate(expiration).getTime() - Date.now()) / 1000))) * BigInt(annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);

	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (BigInt(collateralAmount) * BigInt(price) - BigInt(price) + 1n) / decimalsAdjustment;
	const fees = (feePercent * loanAmount) / 1_000_000n;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const amountToSendToWallet = loanAmount - fees - borrowersReserveContribution;

	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveInterest: number = interest / (1 - reserve);
	const parsedPrice: number = parseFloat(formatUnits(BigInt(price), 36 - collateralDecimals));
	const effectiveLTV: number = (parsedPrice * (1 - reserve)) / collateralPriceDeuro;

	return {
		loanAmount,
		feePercent,
		fees,
		borrowersReserveContribution,
		requiredCollateral: collateralAmount,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		effectiveLTV,
		collateralPriceDeuro,
	};
};

const calculateLoanDetailsByBorrowedAmount = (
	position: PositionQuery,
	amountToSendToWallet: bigint,
	collateralPriceDeuro: number
): LoanDetails => {
	const { price, annualInterestPPM, reserveContribution, expiration, collateralDecimals, original } = position;

	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((toDate(expiration).getTime() - Date.now()) / 1000))) * BigInt(annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);

	const loanAmount = (amountToSendToWallet * 1_000_000n) / (1_000_000n - feePercent - BigInt(reserveContribution));
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const requiredCollateral = (loanAmount * decimalsAdjustment + BigInt(price) - 1n) / BigInt(price);
	const fees = (feePercent * loanAmount) / 1_000_000n;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;

	const parsedPrice: number = parseFloat(formatUnits(BigInt(price), 36 - collateralDecimals));
	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveInterest: number = interest / (1 - reserve);
	const effectiveLTV: number = (parsedPrice * (1 - reserve)) / collateralPriceDeuro;

	return {
		loanAmount,
		feePercent,
		fees,
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		effectiveLTV,
		collateralPriceDeuro,
	};
};

const calculateLoanDetailsByLiquidationPrice = (
	position: PositionQuery,
	liquidationPrice: bigint,
	collateralAmount: bigint,
	collateralPriceDeuro: number
): LoanDetails => {
	const { price, annualInterestPPM, reserveContribution, expiration, collateralDecimals, original } = position;

	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((toDate(expiration).getTime() - Date.now()) / 1000))) * BigInt(annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);

	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (BigInt(collateralAmount) * BigInt(liquidationPrice) - BigInt(liquidationPrice) + 1n) / decimalsAdjustment;
	const fees = (feePercent * loanAmount) / 1_000_000n;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const amountToSendToWallet = loanAmount - fees - borrowersReserveContribution;

	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveInterest: number = interest / (1 - reserve);
	const parsedPrice: number = parseFloat(formatUnits(BigInt(price), 36 - collateralDecimals));
	const effectiveLTV: number = (parsedPrice * (1 - reserve)) / collateralPriceDeuro;

	return {
		loanAmount,
		feePercent,
		fees,
		borrowersReserveContribution,
		requiredCollateral: collateralAmount,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		effectiveLTV,
		collateralPriceDeuro,
	};
};

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
	const positions = useSelector((state: RootState) => (LIST as PositionQuery[]) || state.positions.list.list); // TODO: remove fake data
	const { balances } = useWalletERC20Balances();

	const prices = useSelector((state: RootState) => (PRICES as ApiPriceMapping) || state.prices.coingecko); // TODO: remove fake data
	const collateralPriceDeuro = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.usd || 0; // TODO: change to eur
	const collateralPriceUsd = prices[selectedPosition?.collateral.toLowerCase() as Address]?.price?.usd || 0;
	const decimalsAdjustment = selectedPosition?.collateralDecimals === 0 ? 18 : (selectedPosition?.collateralDecimals as number);
	const collateralEurValue = selectedPosition
		? collateralPriceDeuro * parseFloat(formatUnits(BigInt(collateralAmount), decimalsAdjustment))
		: 0;
	const collateralUsdValue = selectedPosition
		? collateralPriceUsd * parseFloat(formatUnits(BigInt(collateralAmount), decimalsAdjustment))
		: 0;
	const maxLiquidationPrice = BigInt(Math.floor(MAX_LIQUIDATION_PRICE_DECREASE[0].price.eur * 1e18)); // TODO: remove fake data
	const isLiquidationPriceTooHigh = selectedPosition ? BigInt(liquidationPrice) >= maxLiquidationPrice : false;

	const handleOnSelectedToken = (token: TokenBalance) => {
		if (!token) return;
		setSelectedCollateral(token);

		const selectedPosition = positions.find((p) => p.collateral.toLowerCase() == token.address.toLowerCase());
		if (!selectedPosition) return;

		setSelectedPosition(selectedPosition);
		setCollateralAmount(selectedPosition.minimumCollateral);
		setExpirationDate(toDate(selectedPosition.expiration));
		setLiquidationPrice(selectedPosition.price);

		const loanDetails = calculateLoanDetailsByCollateral(
			selectedPosition,
			BigInt(selectedPosition.minimumCollateral),
			collateralPriceDeuro
		);
		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onCollateralChange = (value: string) => {
		setCollateralAmount(value);
		if (!selectedPosition) return;

		const loanDetails = calculateLoanDetailsByCollateral(selectedPosition, BigInt(value), collateralPriceDeuro);
		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onLiquidationPriceChange = (value: string) => {
		setLiquidationPrice(value);

		if (!selectedPosition) return;

		const loanDetails = calculateLoanDetailsByLiquidationPrice(
			selectedPosition,
			BigInt(value),
			BigInt(collateralAmount),
			collateralPriceDeuro
		);
		setLoanDetails(loanDetails);
		setBorrowedAmount(loanDetails.amountToSendToWallet.toString());
	};

	const onYouGetChange = (value: string) => {
		setBorrowedAmount(value);

		if (!selectedPosition) return;

		const loanDetails = calculateLoanDetailsByBorrowedAmount(selectedPosition, BigInt(value), collateralPriceDeuro);
		setLoanDetails(loanDetails);
		setCollateralAmount(loanDetails.requiredCollateral.toString());
	};

	const handleMaxExpirationDate = () => {
		if (selectedPosition?.expiration) {
			setExpirationDate(toDate(selectedPosition.expiration));
		}
	};

	return (
		<div className="md:mt-8 flex justify-center">
			<AppCard className="max-w-lg p-4 flex-col justify-start items-center gap-8 inline-flex overflow-hidden">
				<div className="self-stretch justify-center items-center gap-1.5 inline-flex">
					<div className="text-text-title text-xl font-black ">Borrow dEURO</div>
				</div>

				<div className="self-stretch flex-col justify-start items-center gap-1 flex">
					<InputTitle icon={faCircleQuestion}>Select your collateral asset</InputTitle>
					<TokenInputSelectOutlined
						selectedToken={selectedCollateral}
						onSelectTokenClick={() => setIsOpenTokenSelector(true)}
						value={collateralAmount}
						onChange={onCollateralChange}
						usdValue={collateralUsdValue}
						eurValue={collateralEurValue}
					/>
					<TokenSelectModal
						isOpen={isOpenTokenSelector}
						setIsOpen={setIsOpenTokenSelector}
						options={balances}
						onTokenSelect={handleOnSelectedToken}
					/>
				</div>
				<div className="self-stretch flex-col justify-start items-center gap-1 flex">
					<InputTitle icon={faCircleQuestion}>Select your liquidation price</InputTitle>
					<SliderInputOutlined
						value={liquidationPrice}
						onChange={onLiquidationPriceChange}
						min={BigInt(0)}
						max={maxLiquidationPrice}
						decimals={36 - (selectedPosition?.collateralDecimals || 0)}
						isError={isLiquidationPriceTooHigh}
						errorMessage="Your liquidation price is too high! Change the liquidation price or the amount received."
					/>
				</div>
				<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
					<InputTitle>Set expiration date</InputTitle>
					<DateInputOutlined
						value={expirationDate}
						maxDate={expirationDate}
						onChange={setExpirationDate}
						onMaxClick={expirationDate ? handleMaxExpirationDate : undefined}
					/>
					<div className="self-stretch text-xs font-medium leading-normal">
						The position must either be repaid or extended before the expiry date. Extensions can be found under “My Positions”.
					</div>
				</div>
				<div className="self-stretch flex-col justify-start items-start gap-4 flex">
					<div className="self-stretch flex-col justify-start items-center gap-1.5 flex">
						<InputTitle>You get</InputTitle>
						<NormalInputOutlined value={borrowedAmount} onChange={onYouGetChange} decimals={18} />
					</div>
					<DetailsExpandablePanel loanDetails={loanDetails} />
				</div>
				<GuardToAllowedChainBtn label="Borrow dEURO">
					<Button
						className="!p-4 text-lg font-extrabold leading-none"
						onClick={() => setIsOpenBorrowingDEUROModal(true)}
						disabled={!selectedPosition || !selectedCollateral || isLiquidationPriceTooHigh}
					>
						{isLiquidationPriceTooHigh
							? "Your liquidation price is too high!"
							: `Receive ${formatCurrency(formatUnits(BigInt(borrowedAmount), 18))} dEURO`}
					</Button>
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
				/>
			</AppCard>
		</div>
	);
}
