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

export const useEquityTrades = (address: Address): EquityTrade[] => {
	const { data } = useQuery<{ equityTrades: { items: EquityTrade[] } }>(EQUITY_TRADES_QUERY, {
		client: PONDER_CLIENT,
		fetchPolicy: "no-cache",
		skip: isAddressEqual(address, zeroAddress),
		variables: { trader: address.toLowerCase() },
	});

	if (!data?.equityTrades?.items) return [];

	return data.equityTrades.items.map((i) => ({
		count: Number(i.count),
		created: Number(i.created),
		txHash: i.txHash,
		kind: i.kind,
		amount: BigInt(i.amount),
		shares: BigInt(i.shares),
		price: BigInt(i.price),
	}));
};
