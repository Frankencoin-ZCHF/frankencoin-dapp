import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { PONDER_CLIENT } from "../app.config";

export interface FPSEarningsHistory {
	count: number;
	created: number;
	kind: string;
	amount: bigint;
	perFPS: bigint;
}

type FPSEarningsHistoryRaw = {
	count: string;
	created: string;
	kind: string;
	amount: string;
	perFPS: string;
};

type FPSEarningsHistoryPage = {
	frankencoinProfitLosss: {
		items: FPSEarningsHistoryRaw[];
		pageInfo: { endCursor: string | null; hasNextPage: boolean };
	};
};

// @dev: ponder caps a single page at 1000 items, so the full history has to be walked with cursor pagination
const EARNINGS_HISTORY_QUERY = gql`
	query FPSEarningsHistory($after: String) {
		frankencoinProfitLosss(where: { chainId: 1 }, orderBy: "count", orderDirection: "asc", limit: 1000, after: $after) {
			items {
				count
				created
				kind
				amount
				perFPS
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const fetchAllEarnings = async (): Promise<FPSEarningsHistory[]> => {
	const collected: FPSEarningsHistory[] = [];
	let after: string | null = null;

	do {
		const result: { data?: FPSEarningsHistoryPage } = await PONDER_CLIENT.query<FPSEarningsHistoryPage>({
			query: EARNINGS_HISTORY_QUERY,
			variables: { after },
			fetchPolicy: "no-cache",
		});

		const page: FPSEarningsHistoryPage["frankencoinProfitLosss"] | undefined = result.data?.frankencoinProfitLosss;
		if (!page?.items) break;

		for (const i of page.items) {
			collected.push({
				count: Number(i.count),
				created: Number(i.created),
				kind: i.kind,
				amount: BigInt(i.amount),
				perFPS: BigInt(i.perFPS),
			});
		}

		after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
	} while (after);

	return collected;
};

export const useFPSEarningsHistory = (_address: Address): FPSEarningsHistory[] => {
	const [earnings, setEarnings] = useState<FPSEarningsHistory[]>([]);

	useEffect(() => {
		let cancelled = false;

		fetchAllEarnings()
			.then((items) => {
				if (!cancelled) setEarnings(items);
			})
			.catch((error) => {
				console.error("Failed to fetch FPS earnings history", error);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return earnings;
};
