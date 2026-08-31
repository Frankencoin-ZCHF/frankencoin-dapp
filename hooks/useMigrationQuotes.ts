import { useEffect, useState } from "react";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { ADDRESS, ChainIdSide } from "@frankencoin/zchf";
import { getMigrationQuote } from "@utils";
import { MigrationTokenBalance } from "./useMigrationTokenBalances";

export type MigrationQuote = {
	buyAmount: bigint;
	sellAmount: bigint;
};

export type MigrationQuotesReturn = {
	quotes: Record<Address, MigrationQuote | undefined>;
	isLoading: boolean;
};

// Fetches a CoW quote (sell token -> ZCHF) per held token, keyed by token address, used for
// the "Est. Output" column. Slippage per token only affects the order built at swap time,
// not this preview.
export const useMigrationQuotes = (owner: Address | undefined, tokens: MigrationTokenBalance[]): MigrationQuotesReturn => {
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
					const quote = await getMigrationQuote({
						owner,
						sellToken: token.address,
						sellTokenDecimals: token.decimals,
						buyToken: zchf,
						buyTokenDecimals: 18,
						sellAmount: token.balance,
						slippageBps: 50,
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
	}, [owner, key, zchf]);

	return { quotes, isLoading };
};
