import { PositionQuery } from "@deuro/api";
import { toDate } from "./format";

export type LoanDetails = {
	loanAmount: bigint;
	feePercent: bigint;
	fees: bigint;
	borrowersReserveContribution: bigint;
	amountToSendToWallet: bigint;
	requiredCollateral: bigint;
	originalPosition: `0x${string}`;
	effectiveInterest: number;
	effectiveLTV: number;
	liquidationPrice: bigint;
};

export const calculateYouGetAmountLoanDetails = (position: PositionQuery, collateralAmount: bigint, liquidationPrice: bigint): LoanDetails => {
	const { annualInterestPPM, reserveContribution, expiration, collateralDecimals, original } = position;
	
	const requiredCollateral = collateralAmount;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (BigInt(collateralAmount) * BigInt(liquidationPrice)) / decimalsAdjustment;
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const amountToSendToWallet = loanAmount - borrowersReserveContribution;

	// TODO: Check if this is correct
	const feePercent = 0;
	const fees = 0;
	const interest: number = 0;
	const reserve: number = 0;
	const effectiveInterest: number = 0;
	const effectiveLTV: number = 0;

	return {
		loanAmount,
		feePercent: BigInt(0),
		fees: BigInt(0),
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet: amountToSendToWallet < 0n ? 0n : amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		effectiveLTV,
		liquidationPrice,
	};
};

export const calculateLiquidationPriceLoanDetails = (
	position: PositionQuery,
	collateralAmount: bigint,
	youGet: bigint,
): LoanDetails => {
	const { annualInterestPPM, reserveContribution, expiration, collateralDecimals, original } = position;

	const requiredCollateral = collateralAmount;
	const amountToSendToWallet = youGet;
	const decimalsAdjustment = collateralDecimals === 0 ? BigInt(1e36) : BigInt(1e18);
	const loanAmount = (amountToSendToWallet * 1_000_000n) / (1_000_000n - BigInt(reserveContribution));
	const borrowersReserveContribution = (BigInt(reserveContribution) * loanAmount) / 1_000_000n;
	const liquidationPrice = (loanAmount * decimalsAdjustment) / collateralAmount;

	// TODO: Check if this is correct
	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((toDate(expiration).getTime() - Date.now()) / 1000))) * BigInt(annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);
	const fees = 0;
	const interest: number = 0;
	const reserve: number = 0;
	const effectiveInterest: number = 0;
	const effectiveLTV: number = 0;

	return {
		loanAmount,
		feePercent: BigInt(0),
		fees: BigInt(0),
		borrowersReserveContribution,
		requiredCollateral,
		amountToSendToWallet,
		originalPosition: original,
		effectiveInterest,
		effectiveLTV,
		liquidationPrice,
	};
};