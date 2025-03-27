import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSBalanceHistory {
	id: string;
	count: bigint;
	txHash: string;
	address: Address;
	amount: bigint;
	kind: string;
	balance: bigint;
	created: bigint;
}

// where: { address: "${address.toLowerCase()}" },
// 0x5052D3Cc819f53116641e89b96Ff4cD1EE80B182

export async function FPSBalanceHistory(address: Address): Promise<FPSBalanceHistory[]> {
	const { data } = await PONDER_CLIENT.query({
		fetchPolicy: "no-cache",
		query: gql`
			query {
				balanceHistorys(
					where: { address: "${address}" }
					orderBy: "count"
					orderDirection: "desc"
					limit: 1000
				) {
					items {
						id
						count
						txHash
						address
						amount
						kind
						balance
						created
					}
				}
			}
		`,
	});

	if (!data || !data.balanceHistorys.items) {
		return [];
	}

	return data.balanceHistorys.items;
}
