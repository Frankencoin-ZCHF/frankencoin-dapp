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

const EARNINGS_HISTORY_QUERY = gql`
	query FPSEarningsHistory {
		frankencoinProfitLosss(where: { chainId: 1 }, orderBy: "count", orderDirection: "asc", limit: 1000) {
			items {
				count
				created
				kind
				amount
				perFPS
			}
		}
	}
`;

export const useFPSEarningsHistory = (_address: Address): FPSEarningsHistory[] => {
	const { data } = useQuery<{ frankencoinProfitLosss: { items: FPSEarningsHistory[] } }>(EARNINGS_HISTORY_QUERY, {
		client: PONDER_CLIENT,
		fetchPolicy: "no-cache",
	});

	if (!data?.frankencoinProfitLosss?.items) return [];

	return data.frankencoinProfitLosss.items.map((i) => ({
		id: i.id,
		count: Number(i.count),
		created: Number(i.created),
		kind: i.kind,
		amount: BigInt(i.amount),
		perFPS: BigInt(i.perFPS),
	}));
};
