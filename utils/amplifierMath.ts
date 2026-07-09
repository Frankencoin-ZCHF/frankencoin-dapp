// Math around the UniswapAmplifier's minimum-dollars rule: a mint must provide at least
// getMinimumDollars(borrowedZCHF) in dollars. Since both sides scale linearly with the minted
// liquidity, this is a pure ratio constraint on the range and the pool price.

import { Q96, getAmountsForLiquidity, getSqrtRatioAtTick } from "./uniswapV3Math";

// Mirrors UniswapAmplifier.getMinimumDollars: PRICE_ANCHOR_X96 * zchf / Q96 * 4/5. The 4/5
// factor allows up to 1.25:1 leverage relative to the anchor price.
export function getMinimumDollars(anchorX96: bigint, zchfAmount: bigint): bigint {
	return (((anchorX96 * zchfAmount) / Q96) * 4n) / 5n;
}

/// @dev Whether a mint into [sqrtA, sqrtB] at pool price sqrtP satisfies the amplifier's
///      minimum-dollars rule, mirroring UniswapAmplifier.borrowIntoPool exactly.
export function qualifiesForAmplification(
	sqrtP: bigint,
	sqrtA: bigint,
	sqrtB: bigint,
	anchorX96: bigint,
	usdIsToken0: boolean
): boolean {
	const amounts = getAmountsForLiquidity(sqrtP, sqrtA, sqrtB, 10n ** 18n, true);
	const usd = usdIsToken0 ? amounts.amount0 : amounts.amount1;
	const zchf = usdIsToken0 ? amounts.amount1 : amounts.amount0;
	return usd >= getMinimumDollars(anchorX96, zchf);
}

/// @dev The boundary tick of the qualifying region within [tickLow, tickHigh]: mints work at
///      pool prices on the dollar-rich side of this tick (in "USD per ZCHF" terms: above it).
///      Found by bisection; the dollar-rich end of a range always qualifies.
export function amplificationThresholdTick(tickLow: number, tickHigh: number, anchorX96: bigint, usdIsToken0: boolean): number {
	const sqrtA = getSqrtRatioAtTick(tickLow);
	const sqrtB = getSqrtRatioAtTick(tickHigh);
	let lo = tickLow;
	let hi = tickHigh;
	while (hi - lo > 1) {
		const mid = Math.floor((lo + hi) / 2);
		const qualifies = qualifiesForAmplification(getSqrtRatioAtTick(mid), sqrtA, sqrtB, anchorX96, usdIsToken0);
		if (usdIsToken0 ? qualifies : !qualifies) lo = mid;
		else hi = mid;
	}
	return usdIsToken0 ? lo : hi;
}
