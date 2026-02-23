import { gql, useQuery } from "@apollo/client";
import { Address, zeroAddress } from "viem";

export type PonderDelegationQuery = {
	owner: Address;
	delegatedTo: Address;
};

export type DelegationQuery = {
	owners: {
		[key: Address]: Address;
	};
	delegatees: {
		[key: Address]: Address[];
	};
};

export const useDelegationQuery = (): DelegationQuery => {
	const returnData: DelegationQuery = {
		owners: {},
		delegatees: {},
	};

	const { data, loading } = useQuery(
		gql`
			{
				equityDelegations {
					items {
						owner
						delegatedTo
					}
				}
			}
		`,
		{ fetchPolicy: "cache-first" }
	);

	if (loading || !data || !data.equityDelegations) {
		return returnData;
	}

	const items = data.equityDelegations.items as PonderDelegationQuery[];

	for (const i of items) {
		const owner = i.owner.toLowerCase() as Address;
		const to = i.delegatedTo.toLowerCase() as Address;

		returnData.owners[owner] = to;

		if (!returnData.delegatees[to]) returnData.delegatees[to] = [];
		returnData.delegatees[to].push(owner);
	}

	return returnData;
};
