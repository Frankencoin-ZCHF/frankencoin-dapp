import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";

export interface NativePSHolder {
	id: string;
	address: Address;
	votingPower: bigint;
}

export const useNativePSHolders = (): {
	loading: boolean;
	holders: NativePSHolder[];
} => {
	const { data, loading } = useQuery(
		gql`
			query {
				votingPowers(orderBy: "votingPower", orderDirection: "desc", limit: 25) {
					items {
						id
						address
						votingPower
					}
				}
			}
		`,
		{ fetchPolicy: "no-cache" }
	);

	if (!data || !data.votingPowers) {
		return {
			loading,
			holders: [],
		};
	}

	return {
		loading,
		holders: data.votingPowers.items,
	};
};
