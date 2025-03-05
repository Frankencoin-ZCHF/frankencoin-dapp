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
	liquidationPriceAtEnd: bigint;
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

export const calculateYouGetAmountLoanDetails = (
	position: PositionQuery,
	collateralAmount: bigint,
	liquidationPrice: bigint
): LoanDetails => {
	const { reserveContribution, collateralDecimals, original } = position;

	const requiredCollateral = collateralAmount;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (BigInt(collateralAmount) * BigInt(liquidationPrice)) / decimalsAdjustment;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const amountToSendToWallet = loanAmount - borrowersReserveContribution;

	const { effectiveInterest, apr, interestUntilExpiration, liquidationPriceAtEnd } = getMiscelaneousLoanDetails(
		position,
		loanAmount,
		collateralAmount
	);

	return {
		loanAmount,
		apr,
		interestUntilExpiration,
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		liquidationPrice,
		liquidationPriceAtEnd,
	};
};

export const calculateLiquidationPriceLoanDetails = (position: PositionQuery, collateralAmount: bigint, youGet: bigint): LoanDetails => {
	const { reserveContribution, collateralDecimals, original } = position;

	const requiredCollateral = collateralAmount;
	const amountToSendToWallet = youGet;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (amountToSendToWallet * 1_000_000n) / (1_000_000n - BigInt(reserveContribution));
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const liquidationPrice = (loanAmount * decimalsAdjustment) / collateralAmount;

	const { effectiveInterest, apr, interestUntilExpiration, liquidationPriceAtEnd } = getMiscelaneousLoanDetails(
		position,
		loanAmount,
		collateralAmount
	);

	return {
		loanAmount,
		apr,
		interestUntilExpiration,
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		liquidationPrice,
		liquidationPriceAtEnd,
	};
};
