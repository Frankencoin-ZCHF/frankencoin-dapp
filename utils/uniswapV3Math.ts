// Minimal Uniswap V3 math, ported from the official TickMath / SqrtPriceMath / LiquidityAmounts
// Solidity libraries to bigint. Exact integer math is used wherever amounts are derived, floating
// point only for the tick <-> human price conversions used to render and parse user inputs.

export const Q96 = 2n ** 96n;
const Q32 = 2n ** 32n;
const MAX_UINT256 = 2n ** 256n - 1n;

export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

/// @dev TickMath.getSqrtRatioAtTick: sqrt(1.0001^tick) * 2^96
export function getSqrtRatioAtTick(tick: number): bigint {
	if (tick < MIN_TICK || tick > MAX_TICK || !Number.isInteger(tick)) throw new Error(`Invalid tick: ${tick}`);
	const absTick = tick < 0 ? -tick : tick;

	let ratio = (absTick & 0x1) != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n;
	if (absTick & 0x2) ratio = (ratio * 0xfff97272373d413259a46990580e213an) >> 128n;
	if (absTick & 0x4) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn) >> 128n;
	if (absTick & 0x8) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n) >> 128n;
	if (absTick & 0x10) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n) >> 128n;
	if (absTick & 0x20) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n) >> 128n;
	if (absTick & 0x40) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n) >> 128n;
	if (absTick & 0x80) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n) >> 128n;
	if (absTick & 0x100) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n) >> 128n;
	if (absTick & 0x200) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n) >> 128n;
	if (absTick & 0x400) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n) >> 128n;
	if (absTick & 0x800) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n) >> 128n;
	if (absTick & 0x1000) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n) >> 128n;
	if (absTick & 0x2000) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n) >> 128n;
	if (absTick & 0x4000) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n) >> 128n;
	if (absTick & 0x8000) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n) >> 128n;
	if (absTick & 0x10000) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n) >> 128n;
	if (absTick & 0x20000) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n) >> 128n;
	if (absTick & 0x40000) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n) >> 128n;
	if (absTick & 0x80000) ratio = (ratio * 0x48a170391f7dc42444e8fa2n) >> 128n;

	if (tick > 0) ratio = MAX_UINT256 / ratio;

	// downcast from Q128 to Q96, rounding up
	return ratio / Q32 + (ratio % Q32 > 0n ? 1n : 0n);
}

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
	return (a * b) / denominator;
}

function divRoundingUp(a: bigint, denominator: bigint): bigint {
	return a / denominator + (a % denominator > 0n ? 1n : 0n);
}

function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
	return divRoundingUp(a * b, denominator);
}

/// @dev SqrtPriceMath.getAmount0Delta: token0 amount covered by liquidity between two sqrt prices
export function getAmount0ForLiquidity(sqrtA: bigint, sqrtB: bigint, liquidity: bigint, roundUp: boolean): bigint {
	if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
	if (sqrtA == 0n) throw new Error("sqrt price is zero");
	const numerator = (liquidity << 96n) * (sqrtB - sqrtA);
	return roundUp ? divRoundingUp(divRoundingUp(numerator, sqrtB), sqrtA) : numerator / sqrtB / sqrtA;
}

/// @dev SqrtPriceMath.getAmount1Delta: token1 amount covered by liquidity between two sqrt prices
export function getAmount1ForLiquidity(sqrtA: bigint, sqrtB: bigint, liquidity: bigint, roundUp: boolean): bigint {
	if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
	return roundUp ? mulDivRoundingUp(liquidity, sqrtB - sqrtA, Q96) : mulDiv(liquidity, sqrtB - sqrtA, Q96);
}

/// @dev Both token amounts needed to mint (roundUp = true, as the pool rounds against the minter)
///      or returned when burning (roundUp = false) the given liquidity in the given range.
export function getAmountsForLiquidity(
	sqrtP: bigint,
	sqrtA: bigint,
	sqrtB: bigint,
	liquidity: bigint,
	roundUp: boolean
): { amount0: bigint; amount1: bigint } {
	if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
	if (sqrtP <= sqrtA) {
		return { amount0: getAmount0ForLiquidity(sqrtA, sqrtB, liquidity, roundUp), amount1: 0n };
	} else if (sqrtP >= sqrtB) {
		return { amount0: 0n, amount1: getAmount1ForLiquidity(sqrtA, sqrtB, liquidity, roundUp) };
	} else {
		return {
			amount0: getAmount0ForLiquidity(sqrtP, sqrtB, liquidity, roundUp),
			amount1: getAmount1ForLiquidity(sqrtA, sqrtP, liquidity, roundUp),
		};
	}
}

/// @dev LiquidityAmounts.getLiquidityForAmount0
export function getLiquidityForAmount0(sqrtA: bigint, sqrtB: bigint, amount0: bigint): bigint {
	if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
	if (sqrtB == sqrtA) return 0n;
	const intermediate = mulDiv(sqrtA, sqrtB, Q96);
	return mulDiv(amount0, intermediate, sqrtB - sqrtA);
}

/// @dev LiquidityAmounts.getLiquidityForAmount1
export function getLiquidityForAmount1(sqrtA: bigint, sqrtB: bigint, amount1: bigint): bigint {
	if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
	if (sqrtB == sqrtA) return 0n;
	return mulDiv(amount1, Q96, sqrtB - sqrtA);
}

/// @dev The raw pool price (token1 per token0, in native token units) at the given tick.
export function tickToRawPrice(tick: number): number {
	return Math.pow(1.0001, tick);
}

/// @dev The closest tick for the given raw pool price (token1 per token0, native units).
export function rawPriceToTick(rawPrice: number): number {
	return Math.round(Math.log(rawPrice) / Math.log(1.0001));
}

/// @dev Snaps a tick to the pool's tick spacing and clamps it into [minTick, maxTick].
export function snapTick(tick: number, spacing: number, minTick: number, maxTick: number): number {
	let snapped = Math.round(tick / spacing) * spacing;
	while (snapped < minTick) snapped += spacing;
	while (snapped > maxTick) snapped -= spacing;
	return snapped;
}

/// @dev Converts a Q96 price (token1 per token0, native units) to a float in native units.
export function priceX96ToRawPrice(priceX96: bigint): number {
	return Number((priceX96 * 10n ** 18n) / Q96) / 1e18;
}

// fee growth values are uint256 accumulators that are allowed to overflow, so all
// differences must be taken modulo 2^256 like in Solidity
function subIn256(a: bigint, b: bigint): bigint {
	return (a - b) & MAX_UINT256;
}

/// @dev The fees a position can collect, following the pool's Tick.getFeeGrowthInside and
///      Position.update accounting: fee growth inside the range since the last poke times
///      the liquidity, plus the tokens already owed.
export function getPendingFees(
	currentTick: number,
	tickLow: number,
	tickHigh: number,
	liquidity: bigint,
	feeGrowthGlobal: bigint,
	feeGrowthOutsideLower: bigint,
	feeGrowthOutsideUpper: bigint,
	feeGrowthInsideLast: bigint,
	tokensOwed: bigint
): bigint {
	const below = currentTick >= tickLow ? feeGrowthOutsideLower : subIn256(feeGrowthGlobal, feeGrowthOutsideLower);
	const above = currentTick < tickHigh ? feeGrowthOutsideUpper : subIn256(feeGrowthGlobal, feeGrowthOutsideUpper);
	const inside = subIn256(subIn256(feeGrowthGlobal, below), above);
	return (liquidity * subIn256(inside, feeGrowthInsideLast)) / 2n ** 128n + tokensOwed;
}
