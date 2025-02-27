import { PositionQuery } from "@deuro/api";
import { formatUnits } from "viem";
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
	collateralPriceDeuro: number;
};


export const calculateLoanDetailsByCollateral = (position: PositionQuery, collateralAmount: bigint, collateralPriceDeuro: number): LoanDetails => {
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

export const calculateLoanDetailsByBorrowedAmount = (
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

export const calculateLoanDetailsByLiquidationPrice = (
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