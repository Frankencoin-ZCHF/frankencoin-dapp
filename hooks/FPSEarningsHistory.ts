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
	const { data } = await PONDER_CLIENT.query<{ frankencoinProfitLosss: { items: FPSEarningsHistory[] } }>({
		fetchPolicy: "no-cache",
		query: gql`
			query {
				frankencoinProfitLosss(where: { chainId: 1 }, orderBy: "count", orderDirection: "desc", limit: 1000) {
					items {
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

	if (!data || !data.frankencoinProfitLosss.items) {
		return [];
	}

	const list: FPSEarningsHistory[] = data.frankencoinProfitLosss.items.map((i) => ({
		id: i.id,
		count: Number(i.count),
		created: Number(i.created),
		kind: i.kind,
		amount: BigInt(i.amount),
		perFPS: BigInt(i.perFPS),
	}));

	return list;
}
