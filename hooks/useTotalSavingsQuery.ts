import { gql, useQuery } from "@apollo/client";

interface TotalSavings {
	id: string;
	total: string;
}

export const useTotalSavingsQuery = (): {
	loading: boolean;
	totalSavings: TotalSavings[];
} => {
	const { data, loading } = useQuery(
		gql`
			{
				savingsTotalHistorys(orderDirection: "desc", orderBy: "time", limit: 1000) {
					items {
						id
						time
						total
					}
				}
			}
		`
	);

	if (!data || !data.savingsTotalHistorys) {
		return {
			loading,
			totalSavings: [],
		};
	}

	return {
		loading,
		totalSavings: data.savingsTotalHistorys.items,
	};
};
