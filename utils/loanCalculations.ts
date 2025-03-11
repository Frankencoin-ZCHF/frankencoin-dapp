import { PositionQuery } from "@deuro/api";
import { toDate } from "./format";

export type LoanDetails = {
	loanAmount: bigint;
	apr: number;
	interestUntilExpiration: bigint;
	borrowersReserveContribution: bigint;
	amountToSendToWallet: bigint;
	requiredCollateral: bigint;
	originalPosition: `0x${string}`;
	effectiveInterest: number;
	liquidationPrice: bigint;
	startingLiquidationPrice: bigint;
};

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const getLoanDuration = (position: PositionQuery) => {
	return Math.max(60 * 60 * 24 * 30, Math.floor((toDate(position.expiration).getTime() - toDate(position.start).getTime()) / 1000));
};

const getMiscelaneousLoanDetails = (position: PositionQuery, loanAmount: bigint, collateralAmount: bigint) => {
	const { fixedAnnualRatePPM, annualInterestPPM, collateralDecimals } = position;

	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const effectiveInterest = Number((BigInt(fixedAnnualRatePPM) * 100n) / 1_000_000n);
	const selectedPeriod = getLoanDuration(position);
	const interestUntilExpiration =
		(BigInt(selectedPeriod) * BigInt(annualInterestPPM) * BigInt(loanAmount)) / BigInt(ONE_YEAR_IN_SECONDS * 1_000_000);
	const apr = (((Number(interestUntilExpiration) / Number(loanAmount)) * ONE_YEAR_IN_SECONDS) / selectedPeriod) * 100;
	const liquidationPriceAtEnd = (loanAmount + interestUntilExpiration) * decimalsAdjustment / collateralAmount;

	return {
		effectiveInterest,
		apr,
		interestUntilExpiration,
		liquidationPriceAtEnd,
	};
};

export const getLoanDetailsByCollateralAndLiqPrice = (
	position: PositionQuery,
	collateralAmount: bigint,
	liquidationPriceAtEndOfPeriod: bigint
): LoanDetails => {
	const { reserveContribution, collateralDecimals, original, annualInterestPPM } = position;

	const requiredCollateral = collateralAmount;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmountEndOfPeriod = (BigInt(collateralAmount) * BigInt(liquidationPriceAtEndOfPeriod)) / decimalsAdjustment;

	const selectedPeriod = getLoanDuration(position);
	const loanAmountAtStartOfPeriod = (loanAmountEndOfPeriod * BigInt(ONE_YEAR_IN_SECONDS * 1_000_000)) / (BigInt(ONE_YEAR_IN_SECONDS * 1_000_000) + (BigInt(selectedPeriod) * BigInt(annualInterestPPM)));
	const interestUntilExpiration = loanAmountEndOfPeriod - loanAmountAtStartOfPeriod;

	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmountAtStartOfPeriod) / 1_000_000n;
	const amountToSendToWallet = loanAmountAtStartOfPeriod - borrowersReserveContribution;


	const { effectiveInterest, apr } = getMiscelaneousLoanDetails(
		position,
		loanAmountEndOfPeriod,
		collateralAmount
	);

	const startingLiquidationPrice = (loanAmountAtStartOfPeriod * decimalsAdjustment) / collateralAmount;

	return {
		loanAmount: loanAmountAtStartOfPeriod,
		apr,
		interestUntilExpiration,
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		liquidationPrice: liquidationPriceAtEndOfPeriod,
		startingLiquidationPrice,
	};
};

export const getLoanDetailsByCollateralAndYouGetAmount = (position: PositionQuery, collateralAmount: bigint, youGet: bigint): LoanDetails => {
	const { reserveContribution, collateralDecimals, original, annualInterestPPM } = position;

	const requiredCollateral = collateralAmount;
	const amountToSendToWallet = youGet;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmountStartOfPeriod = (amountToSendToWallet * 1_000_000n) / (1_000_000n - BigInt(reserveContribution));

	const startingLiquidationPrice = (loanAmountStartOfPeriod * decimalsAdjustment) / collateralAmount;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmountStartOfPeriod) / 1_000_000n;

	const selectedPeriod = getLoanDuration(position);
	const interestCoefficient = (BigInt(selectedPeriod) * BigInt(annualInterestPPM)) / BigInt(ONE_YEAR_IN_SECONDS * 1_000_000);
	const loanAmountEndOfPeriod = loanAmountStartOfPeriod + interestCoefficient;

	const { effectiveInterest, apr, interestUntilExpiration, liquidationPriceAtEnd } = getMiscelaneousLoanDetails(
		position,
		loanAmountEndOfPeriod,
		collateralAmount
	);

	return {
		loanAmount: loanAmountStartOfPeriod,
		apr,
		interestUntilExpiration,
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		liquidationPrice: liquidationPriceAtEnd,
		startingLiquidationPrice,
	};
};
