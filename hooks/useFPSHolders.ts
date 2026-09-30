import { gql, useQuery } from "@apollo/client";
import { Address } from "viem";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export interface FPSHolder {
	account: Address;
	balance: bigint;
	updated: number;
}

const HOLDERS_QUERY = gql`
	query FPSHolders($token: String!) {
		eRC20BalanceMappings(orderBy: "balance", limit: 20, orderDirection: "desc", where: { token: $token }) {
			items {
				account
				balance
				updated
			}
		}
	}
`;

export const useFPSHolders = (
	token: Address = ADDRESS[mainnet.id].equity
): {
	loading: boolean;
	holders: FPSHolder[];
} => {
	const { data, loading } = useQuery<{
		eRC20BalanceMappings: {
			items: FPSHolder[];
		};
	}>(HOLDERS_QUERY, { fetchPolicy: "no-cache", variables: { token: token.toLowerCase() } });

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
