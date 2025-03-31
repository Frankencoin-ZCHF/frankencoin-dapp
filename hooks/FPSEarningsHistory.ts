import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSEarningsHistory {
	id: string;
	count: bigint;
	created: bigint;
	kind: string;
	amount: bigint;
	perFPS: bigint;
}

export async function FPSEarningsHistory(address: Address): Promise<FPSEarningsHistory[]> {
	const { data } = await PONDER_CLIENT.query({
		fetchPolicy: "no-cache",
		query: gql`
			query {
				profitLosss(orderBy: "count", orderDirection: "desc", limit: 1000) {
					items {
						id
						count
						created
						kind
						amount
						perFPS
					}
				}
			}
		`,
	});

	if (!data || !data.profitLosss.items) {
		return [];
	}

	return data.profitLosss.items;
}
