import { Address } from "viem";
import { mainnet } from "viem/chains";

// Morpho Blue: zero-fee flashloan provider for the leverage collateral.
export const LEVERAGE_FLASHLOAN_PROVIDER: Address = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";
export const LEVERAGE_CHAIN_ID = mainnet.id;

// LeverageGeneric (mainnet), deployed via LeverageGenericModule.
export const LEVERAGE_EXECUTOR_ADDRESS: Address = "0x80b9d6E54189881654A28727Dfa05aaCF83F94a2";

export const LEVERAGE_EXECUTOR_ABI = [
	{
		name: "executeWithZCHF",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "source", type: "address" },
			{ name: "equityAmount", type: "uint256" }, // ZCHF equity
			{ name: "collateralAmount", type: "uint256" }, // C, deposited into the position
			{ name: "expiration", type: "uint40" },
			{ name: "swapData", type: "bytes" }, // router calldata: ZCHF -> collateral
		],
		outputs: [{ name: "leveragedPosition", type: "address" }],
	},
	{
		name: "executeWithCollateral",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "source", type: "address" },
			{ name: "equityAmount", type: "uint256" }, // collateral equity
			{ name: "collateralAmount", type: "uint256" },
			{ name: "expiration", type: "uint40" },
			{ name: "swapData", type: "bytes" },
		],
		outputs: [{ name: "leveragedPosition", type: "address" }],
	},
] as const;

// Collaterals with less flashloan liquidity than this (USD) are not offered for leverage.
export const LEVERAGE_MIN_FLASHLOAN_USD = 10_000;

// Mirrors PositionV2.calculateFee: feePPM = duration * annualPPM / 365 days
export const SECS_PER_YEAR = 365 * 24 * 3600;

interface LeveragePosition {
	price: string;
	collateralDecimals: number;
	reserveContribution: number;
	annualInterestPPM: number;
}

/**
 * Net ZCHF released per ZCHF of collateral value, as in LeverageGeneric:
 *   credit = liqPrice × (1 − resPPM − feePPM) / marketPrice
 * @param marketPriceChf collateral market price in ZCHF (CHF)
 * @param durationSecs   clone duration in seconds
 */
export function leverageCredit(position: LeveragePosition, marketPriceChf: number, durationSecs: number): number {
	if (!(marketPriceChf > 0)) return 0;
	const liqPrice = Number(position.price) / 10 ** (36 - position.collateralDecimals);
	const reserve = position.reserveContribution / 1_000_000;
	const fee = (position.annualInterestPPM / 1_000_000) * (Math.max(0, durationSecs) / SECS_PER_YEAR);
	return Math.max(0, (liqPrice * (1 - reserve - fee)) / marketPriceChf);
}

/** Leverage factor 1 / (1 − credit), 0 if leverage is not possible. */
export function leverageFactor(credit: number): number {
	return credit > 0.001 && credit < 1 ? 1 / (1 - credit) : 0;
}
