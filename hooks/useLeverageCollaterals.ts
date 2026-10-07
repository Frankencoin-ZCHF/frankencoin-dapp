import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Address, erc20Abi } from "viem";
import { useReadContracts } from "wagmi";
import { ERC20Info, PositionQueryV2 } from "@frankencoin/api";
import { RootState } from "../redux/redux.store";
import { useBorrowPositions } from "./useBorrowPositions";
import {
	LEVERAGE_CHAIN_ID,
	LEVERAGE_FLASHLOAN_PROVIDER,
	LEVERAGE_MIN_FLASHLOAN_USD,
	leverageCredit,
	leverageFactor,
	normalizeAddress,
} from "@utils";

export type LeverageCollateral = {
	collateral: ERC20Info;
	// borrow position to clone (best LTV, still available for clones)
	position: PositionQueryV2;
	priceChf: number;
	priceUsd: number;
	// idle collateral in the flashloan provider (Morpho Blue), token units
	flashloanLiquidity: number;
	flashloanLiquidityUsd: number;
	// maximum leverage at the position maturity
	maxLeverage: number;
};

/**
 * Collaterals accepted by Frankencoin (redux: prices.collateral) that can be leveraged:
 * they need an open borrow position and enough idle liquidity in Morpho to flashloan.
 */
export const useLeverageCollaterals = () => {
	const accepted = useSelector((state: RootState) => state.prices.collateral);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const { bestPriceByCollateral } = useBorrowPositions();

	const candidates = useMemo(
		() =>
			Object.values(accepted)
				.map((c) => ({ ...c, address: normalizeAddress(c.address) as Address }))
				.filter((c) => !!bestPriceByCollateral[c.address]),
		[accepted, bestPriceByCollateral]
	);

	const { data, isLoading } = useReadContracts({
		contracts: candidates.map((c) => ({
			address: c.address,
			chainId: LEVERAGE_CHAIN_ID,
			abi: erc20Abi,
			functionName: "balanceOf" as const,
			args: [LEVERAGE_FLASHLOAN_PROVIDER],
		})),
		query: { enabled: candidates.length > 0, staleTime: 60_000 },
	});

	const list = useMemo(() => {
		const rows: LeverageCollateral[] = [];

		candidates.forEach((c, i) => {
			const position = bestPriceByCollateral[c.address];
			const balance = (data?.[i]?.result as bigint | undefined) ?? 0n;
			const priceChf = prices[c.address]?.price?.chf ?? 0;
			const priceUsd = prices[c.address]?.price?.usd ?? 0;
			if (!position || priceChf <= 0 || priceUsd <= 0) return;

			const flashloanLiquidity = Number(balance) / 10 ** c.decimals;
			const flashloanLiquidityUsd = flashloanLiquidity * priceUsd;
			if (flashloanLiquidityUsd < LEVERAGE_MIN_FLASHLOAN_USD) return;

			const duration = Math.max(0, position.expiration - Date.now() / 1000);
			const maxLeverage = leverageFactor(leverageCredit(position, priceChf, duration));
			if (maxLeverage <= 0) return;

			rows.push({ collateral: c, position, priceChf, priceUsd, flashloanLiquidity, flashloanLiquidityUsd, maxLeverage });
		});

		return rows.sort((a, b) => b.flashloanLiquidityUsd - a.flashloanLiquidityUsd);
	}, [candidates, bestPriceByCollateral, data, prices]);

	return { list, isLoading };
};
