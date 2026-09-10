import { gql, useQuery } from "@apollo/client";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface EquityTrade {
	count: number;
	created: number;
	txHash: string;
	kind: string;
	amount: bigint;
	shares: bigint;
	price: bigint;
}

const EQUITY_TRADES_QUERY = gql`
	query EquityTrades($trader: String!) {
		equityTrades(where: { trader: $trader }, orderBy: "count", orderDirection: "DESC") {
			items {
				amount
				kind
				price
				shares
				txHash
				count
				created
			}
		}
	}
`;

// FCS deposit/withdraw share the same underlying ZCHF<->shares shape as FPS invest/redeem, so they
// normalize into the same EquityTrade fields. Wrap/unwrap are a strict 1:1 FPS<->FCS swap with no ZCHF
// leg — amount is left at 0n and price at 0n, and the row renderer special-cases those two kinds.
const FCS_TRADES_QUERY = gql`
	query FCSTrades($owner: String!) {
		fCSDeposits(where: { owner: $owner }, orderBy: "count", orderDirection: "DESC") {
			items {
				assets
				shares
				txHash
				count
				created
			}
		}
		fCSWithdraws(where: { owner: $owner }, orderBy: "count", orderDirection: "DESC") {
			items {
				assets
				shares
				txHash
				count
				created
			}
		}
		fCSWrappeds(where: { who: $owner }, orderBy: "count", orderDirection: "DESC") {
			items {
				amount
				txHash
				count
				created
			}
		}
		fCSUnwrappeds(where: { who: $owner }, orderBy: "count", orderDirection: "DESC") {
			items {
				amount
				txHash
				count
				created
			}
		}
	}
`;

interface FCSTradesData {
	fCSDeposits: { items: { assets: string; shares: string; txHash: string; count: string; created: string }[] };
	fCSWithdraws: { items: { assets: string; shares: string; txHash: string; count: string; created: string }[] };
	fCSWrappeds: { items: { amount: string; txHash: string; count: string; created: string }[] };
	fCSUnwrappeds: { items: { amount: string; txHash: string; count: string; created: string }[] };
}

export const useEquityTrades = (address: Address): EquityTrade[] => {
	const skip = isAddressEqual(address, zeroAddress);

	const { data } = useQuery<{ equityTrades: { items: EquityTrade[] } }>(EQUITY_TRADES_QUERY, {
		client: PONDER_CLIENT,
		fetchPolicy: "no-cache",
		skip,
		variables: { trader: address.toLowerCase() },
	});

	const { data: fcsData } = useQuery<FCSTradesData>(FCS_TRADES_QUERY, {
		client: PONDER_CLIENT,
		fetchPolicy: "no-cache",
		skip,
		variables: { owner: address.toLowerCase() },
	});

	const fpsTrades: EquityTrade[] = (data?.equityTrades?.items ?? []).map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind: i.kind,
		amount: BigInt(i.amount),
		shares: BigInt(i.shares),
		price: BigInt(i.price),
	}));

	const deposits: EquityTrade[] = (fcsData?.fCSDeposits?.items ?? []).map((i) => {
		const assets = BigInt(i.assets);
		const shares = BigInt(i.shares);
		return {
			count: Number(i.count),
			created: Number(i.created),
			txHash: i.txHash,
			kind: "FCS Deposit",
			amount: assets,
			shares,
			price: shares > 0n ? (assets * 10n ** 18n) / shares : 0n,
		};
	});

	const withdraws: EquityTrade[] = (fcsData?.fCSWithdraws?.items ?? []).map((i) => {
		const assets = BigInt(i.assets);
		const shares = BigInt(i.shares);
		return {
			count: Number(i.count),
			created: Number(i.created),
			txHash: i.txHash,
			kind: "FCS Withdraw",
			amount: assets,
			shares,
			price: shares > 0n ? (assets * 10n ** 18n) / shares : 0n,
		};
	});

	const wraps: EquityTrade[] = (fcsData?.fCSWrappeds?.items ?? []).map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind: "FCS Wrap",
		amount: 0n,
		shares: BigInt(i.amount),
		price: 0n,
	}));

	const unwraps: EquityTrade[] = (fcsData?.fCSUnwrappeds?.items ?? []).map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind: "FCS Unwrap",
		amount: 0n,
		shares: BigInt(i.amount),
		price: 0n,
	}));

	return [...fpsTrades, ...deposits, ...withdraws, ...wraps, ...unwraps];
};
