import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSBalanceHistory {
	id: string;
	count: bigint;
	created: bigint;
	txHash: string;
	from: Address;
	to: Address;
	amount: bigint;
	balanceFrom: bigint;
	balanceTo: bigint;
}

export async function FPSBalanceHistory(address: Address): Promise<FPSBalanceHistory[]> {
	const { data } = await PONDER_CLIENT.query({
		fetchPolicy: "no-cache",
		query: gql`
			query {
				balanceHistorys(
					where: { 
						OR: [
							{ from: "${address.toLowerCase()}" },
							{ to: "${address.toLowerCase()}" }
						]
					},
					orderBy: "count"
					orderDirection: "desc"
					limit: 1000
				) {
					items {
						id
						count
						created
						txHash
						from
						to
						amount
						balanceFrom
						balanceTo
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
