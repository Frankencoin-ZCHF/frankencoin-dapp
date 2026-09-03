import { gql, useQuery } from "@apollo/client";
import { Address, zeroAddress } from "viem";

export interface SavingsReferrerMapping {
	referrer: Address;
	balance: bigint;
	account: Address;
}

export const useSavingsReferrerMappings = (): {
	loading: boolean;
	mappings: SavingsReferrerMapping[];
} => {
	const { data, loading } = useQuery<{
		savingsReferrerMappings: {
			items: SavingsReferrerMapping[];
		};
	}>(
		gql`
			query {
				savingsReferrerMappings(where: { referrer_not: "${zeroAddress}" }, orderBy: "balance", orderDirection: "DESC") {
					items {
						referrer
						balance
						account
					}
				}
			}
		`,
		{ fetchPolicy: "no-cache" }
	);

	if (!data || !data.savingsReferrerMappings) {
		return {
			loading,
			mappings: [],
		};
	}

	return {
		loading,
		mappings: data.savingsReferrerMappings.items,
	};
};
