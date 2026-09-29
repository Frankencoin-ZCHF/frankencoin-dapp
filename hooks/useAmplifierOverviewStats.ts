import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Address, parseUnits } from "viem";
import { AmplifierQuery, PositionQuery, PriceQuery } from "@frankencoin/api";
import { RootState } from "../redux/redux.store";
import { normalizeAddress } from "@utils";
import { type CollateralOverviewStat } from "./useSwapVCHFStats";

/**
 * Renders one amplifier as a row of the collateral overview. An amplifier is a ZCHF minter
 * outside the MintingHub: it borrows against a Uniswap position instead of against a deposited
 * collateral token, so `avgCollateral` is the redemption value of that position per ZCHF of
 * debt, not a liquidation-price ratio. The USD side of the pool stands in as the collateral
 * token, which is what carries the logo, the price and the category filters.
 */
export function amplifierToCollateralOverview(amplifier: AmplifierQuery, zchfPrice: PriceQuery | undefined): CollateralOverviewStat {
	const usdAddress = normalizeAddress(amplifier.usd);
	const zchfAddress = normalizeAddress(amplifier.zchf);

	// the pool price is quoted as USD per ZCHF, so one USD is worth its reciprocal in ZCHF
	const usdPriceInZchf = amplifier.usdPerZchf > 0 ? 1 / amplifier.usdPerZchf : 0;

	const collateral: PriceQuery = {
		chainId: amplifier.chainId,
		address: usdAddress,
		name: `Uniswap ${amplifier.usdSymbol} Amplifier`,
		symbol: amplifier.usdSymbol,
		decimals: amplifier.usdDecimals,
		price: { chf: usdPriceInZchf },
		timestamp: amplifier.asOf,
	};

	const mint: PriceQuery = zchfPrice ?? {
		chainId: amplifier.chainId,
		address: zchfAddress,
		name: "Frankencoin",
		symbol: "ZCHF",
		decimals: 18,
		price: { chf: 1 },
		timestamp: amplifier.asOf,
	};

	const limit = BigInt(amplifier.limit);
	const borrowed = BigInt(amplifier.totalBorrowed);
	const available = limit > borrowed ? limit - borrowed : 0n;

	return {
		// only the address is read, as the react key and for the row link
		original: { position: amplifier.address } as PositionQuery,
		originals: [],
		clones: [],
		// the USD side of the pool, the part of the backing that has a collateral-like token
		balance: parseUnits(amplifier.usdAmount.toFixed(amplifier.usdDecimals), amplifier.usdDecimals),
		collateral,
		mint,
		minted: borrowed,
		reserve: 0n, // amplifier debt carries no minter reserve
		// the overview renders these two in whole ZCHF, unlike `minted` and `reserve`
		limitForClones: limit / 10n ** 18n,
		availableForClones: available / 10n ** 18n,
		totalValue: amplifier.poolValueZchf,
		avgCollateral: amplifier.avgCollRatio,
		highestZCHFPrice: usdPriceInZchf,
		collateralizedPct: amplifier.avgCollRatio * 100,
		availableForClonesPct: limit > 0n ? Math.round((Number(available) / Number(limit)) * 10000) / 100 : 0,
		collateralPriceInZCHF: usdPriceInZchf,
		worstStatusColors: "green-300",
		lowestInterestRate: 0,
		discussionLink: "",
		lockedValue: amplifier.poolValueZchf,
		avgReserveRatio: 0,
		// the pool holds both sides, so the overview lists them instead of a single ZCHF value
		pairedZchfAmount: amplifier.zchfAmount,
	};
}

/**
 * The amplifiers of the redux store, shaped as collateral overview rows.
 */
export const useAmplifierOverviewStats = (): CollateralOverviewStat[] => {
	const list = useSelector((state: RootState) => state.amplifiers.list);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	return useMemo(
		() => list.map((a) => amplifierToCollateralOverview(a, coingecko[normalizeAddress(a.zchf) as Address])),
		[list, coingecko]
	);
};
