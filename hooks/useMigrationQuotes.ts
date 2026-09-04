import { useEffect, useState } from "react";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { ADDRESS, ChainIdSide } from "@frankencoin/zchf";
import { getEnsoRoute, getMigrationQuote } from "@utils";
import { MigrationTokenBalance } from "./useMigrationTokenBalances";

const PREVIEW_SLIPPAGE_BPS = 50;

export type MigrationQuote = {
	buyAmount: bigint;
	sellAmount: bigint;
};

export type MigrationQuotesReturn = {
	quotes: Record<Address, MigrationQuote | undefined>;
	isLoading: boolean;
};

// Fetches a quote (sell token -> ZCHF) per held token, keyed by token address, used for the
// "Est. Output" column — via Enso's route API when useEnso is on, otherwise CoW. Slippage per
// token only affects the order built at swap time, not this preview.
export const useMigrationQuotes = (
	owner: Address | undefined,
	tokens: MigrationTokenBalance[],
	useEnso: boolean
): MigrationQuotesReturn => {
	const [quotes, setQuotes] = useState<Record<Address, MigrationQuote | undefined>>({});
	const [isLoading, setLoading] = useState(false);

	const zchf = ADDRESS[gnosis.id as ChainIdSide].ccipBridgedFrankencoin;
	const key = owner ? tokens.map((t) => `${t.address}:${t.balance.toString()}`).join(",") : "";

	useEffect(() => {
		if (!owner || tokens.length === 0) {
			setQuotes({});
			return;
		}

		let cancelled = false;
		setLoading(true);

		const fetcher = async () => {
			const results = await Promise.allSettled(
				tokens.map(async (token) => {
					if (useEnso) {
						const route = await getEnsoRoute({
							chainId: gnosis.id,
							fromAddress: owner,
							receiver: owner,
							amountIn: [token.balance.toString()],
							tokenIn: [token.address],
							tokenOut: [zchf],
							slippage: PREVIEW_SLIPPAGE_BPS,
							routingStrategy: "router",
						});
						const amountOut = Array.isArray(route.amountOut) ? route.amountOut[0] : route.amountOut;
						return { address: token.address, buyAmount: BigInt(amountOut), sellAmount: token.balance };
					}

					const quote = await getMigrationQuote({
						owner,
						sellToken: token.address,
						sellTokenDecimals: token.decimals,
						buyToken: zchf,
						buyTokenDecimals: 18,
						sellAmount: token.balance,
						slippageBps: PREVIEW_SLIPPAGE_BPS,
					});
					return { address: token.address, buyAmount: BigInt(quote.orderToSign.buyAmount), sellAmount: token.balance };
				})
			);

			if (cancelled) return;

			const next: Record<Address, MigrationQuote | undefined> = {};
			for (const result of results) {
				if (result.status === "fulfilled") {
					next[result.value.address] = { buyAmount: result.value.buyAmount, sellAmount: result.value.sellAmount };
				}
			}

			setQuotes(next);
			setLoading(false);
		};

		fetcher();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [owner, key, zchf, useEnso]);

	return { quotes, isLoading };
};
