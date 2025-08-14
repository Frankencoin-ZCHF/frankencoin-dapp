import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";

export interface FPSHolder {
	account: Address;
	balance: bigint;
	updated: number;
}

export const useFPSHolders = (): {
	loading: boolean;
	holders: FPSHolder[];
} => {
	const { data, loading } = useQuery<{
		eRC20BalanceMappings: {
			items: FPSHolder[];
		};
	}>(
		gql`
			query {
				eRC20BalanceMappings(
					orderBy: "balance"
					limit: 20
					orderDirection: "desc"
					where: { token: "0x1ba26788dfde592fec8bcb0eaff472a42be341b2" }
				) {
					items {
						account
						balance
						updated
					}
				}
			}
		`,
		{ fetchPolicy: "no-cache" }
	);

	if (!data || !data.eRC20BalanceMappings) {
		return {
			loading,
			holders: [],
		};
	}

	return {
		loading,
		holders: data.eRC20BalanceMappings.items,
	};
};
