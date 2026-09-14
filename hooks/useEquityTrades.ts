import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { PONDER_CLIENT } from "../app.config";
import { fetchAllPonderPages } from "../utils/ponderPagination";

export interface EquityTrade {
	count: number;
	created: number;
	txHash: string;
	kind: string;
	amount: bigint;
	shares: bigint;
	price: bigint;
}

type RawEquityTrade = { amount: string; kind: string; price: string; shares: string; txHash: string; count: string; created: string };
type RawFcsAssetTrade = { assets: string; shares: string; txHash: string; count: string; created: string };
type RawFcsAmountTrade = { amount: string; txHash: string; count: string; created: string };

const EQUITY_TRADES_QUERY = gql`
	query EquityTrades($trader: String!, $after: String) {
		equityTrades(where: { trader: $trader }, orderBy: "count", orderDirection: "DESC", after: $after) {
			items {
				amount
				kind
				price
				shares
				txHash
				count
				created
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

// FCS deposit/withdraw share the same underlying ZCHF<->shares shape as FPS invest/redeem, so they
// normalize into the same EquityTrade fields. Wrap/unwrap are a strict 1:1 FPS<->FCS swap with no ZCHF
// leg — amount is left at 0n and price at 0n, and the row renderer special-cases those two kinds.
// @dev: each connection is paginated independently (rather than one combined query) since cursor
// pagination can't walk multiple independent connections behind a single `after` variable.
const FCS_DEPOSITS_QUERY = gql`
	query FCSDeposits($owner: String!, $after: String) {
		fCSDeposits(where: { owner: $owner }, orderBy: "count", orderDirection: "DESC", after: $after) {
			items {
				assets
				shares
				txHash
				count
				created
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const FCS_WITHDRAWS_QUERY = gql`
	query FCSWithdraws($owner: String!, $after: String) {
		fCSWithdraws(where: { owner: $owner }, orderBy: "count", orderDirection: "DESC", after: $after) {
			items {
				assets
				shares
				txHash
				count
				created
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const FCS_WRAPPEDS_QUERY = gql`
	query FCSWrappeds($owner: String!, $after: String) {
		fCSWrappeds(where: { who: $owner }, orderBy: "count", orderDirection: "DESC", after: $after) {
			items {
				amount
				txHash
				count
				created
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const FCS_UNWRAPPEDS_QUERY = gql`
	query FCSUnwrappeds($owner: String!, $after: String) {
		fCSUnwrappeds(where: { who: $owner }, orderBy: "count", orderDirection: "DESC", after: $after) {
			items {
				amount
				txHash
				count
				created
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const toAssetTrade =
	(kind: string) =>
	(i: RawFcsAssetTrade): EquityTrade => {
		const assets = BigInt(i.assets);
		const shares = BigInt(i.shares);
		return {
			count: Number(i.count),
			created: Number(i.created),
			txHash: i.txHash,
			kind,
			amount: assets,
			shares,
			price: shares > 0n ? (assets * 10n ** 18n) / shares : 0n,
		};
	};

const toAmountTrade =
	(kind: string) =>
	(i: RawFcsAmountTrade): EquityTrade => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind,
		amount: 0n,
		shares: BigInt(i.amount),
		price: 0n,
	});

export const useEquityTrades = (address: Address): EquityTrade[] => {
	const skip = isAddressEqual(address, zeroAddress);
	const [trades, setTrades] = useState<EquityTrade[]>([]);

	useEffect(() => {
		if (skip) {
			setTrades([]);
			return;
		}

		let cancelled = false;
		const trader = address.toLowerCase();

		Promise.all([
			fetchAllPonderPages<RawEquityTrade>(PONDER_CLIENT, EQUITY_TRADES_QUERY, "equityTrades", { trader }),
			fetchAllPonderPages<RawFcsAssetTrade>(PONDER_CLIENT, FCS_DEPOSITS_QUERY, "fCSDeposits", { owner: trader }),
			fetchAllPonderPages<RawFcsAssetTrade>(PONDER_CLIENT, FCS_WITHDRAWS_QUERY, "fCSWithdraws", { owner: trader }),
			fetchAllPonderPages<RawFcsAmountTrade>(PONDER_CLIENT, FCS_WRAPPEDS_QUERY, "fCSWrappeds", { owner: trader }),
			fetchAllPonderPages<RawFcsAmountTrade>(PONDER_CLIENT, FCS_UNWRAPPEDS_QUERY, "fCSUnwrappeds", { owner: trader }),
		])
			.then(([equityItems, deposits, withdraws, wraps, unwraps]) => {
				if (cancelled) return;

				const fpsTrades: EquityTrade[] = equityItems.map((i) => ({
					count: Number(i.count),
					created: Number(i.created),
					txHash: i.txHash,
					kind: i.kind,
					amount: BigInt(i.amount),
					shares: BigInt(i.shares),
					price: BigInt(i.price),
				}));

				setTrades([
					...fpsTrades,
					...deposits.map(toAssetTrade("FCS Deposit")),
					...withdraws.map(toAssetTrade("FCS Withdraw")),
					...wraps.map(toAmountTrade("FCS Wrap")),
					...unwraps.map(toAmountTrade("FCS Unwrap")),
				]);
			})
			.catch((error) => {
				console.error("Failed to fetch equity trades", error);
			});

		return () => {
			cancelled = true;
		};
	}, [address, skip]);

	return trades;
};
