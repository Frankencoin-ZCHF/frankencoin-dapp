import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSEarningsHistory {
	id: string;
	count: number;
	created: number;
	kind: string;
	amount: bigint;
	perFPS: bigint;
}

export async function FPSEarningsHistory(address: Address): Promise<FPSEarningsHistory[]> {
	const { data } = await PONDER_CLIENT.query<{ profitLosss: { items: FPSEarningsHistory[] } }>({
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

	const list: FPSEarningsHistory[] = data.profitLosss.items.map((i) => ({
		id: i.id,
		count: Number(i.count),
		created: Number(i.created),
		kind: i.kind,
		amount: BigInt(i.amount),
		perFPS: BigInt(i.perFPS),
	}));

	return list;
}
