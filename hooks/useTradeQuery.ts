import { gql, useQuery } from "@apollo/client";

interface TradeChart {
	id: string;
	lastPrice: string;
	time: string;
}

export const useTradeQuery = (): {
	loading: boolean;
	trades: TradeChart[];
} => {
	const { data, loading } = useQuery(
		gql`
			query {
				tradeCharts(orderDirection: "desc", orderBy: "time", limit: 100) {
					items {
						id
						lastPrice
						time
					}
				}
			}
		`
	);

	if (!data || !data.tradeCharts) {
		return {
			loading,
			trades: [],
		};
	}

	return {
		loading,
		trades: data.tradeCharts.items,
	};
};
