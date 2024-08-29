import { gql, useQuery } from "@apollo/client";
import { Address, zeroAddress } from "viem";

export type PonderDelegationQuery = {
	owner: Address;
	delegatedTo: Address;
};

export type DelegationQueryMappingObject = {
	[key: Address]: Address[];
};

export type DelegationQuery = {
	delegaters: DelegationQueryMappingObject;
	delegatees: DelegationQueryMappingObject;
};

export const useDelegationQuery = (): DelegationQuery => {
	const returnData: DelegationQuery = {
		delegaters: {},
		delegatees: {},
	};

	const { data, loading } = useQuery(
		gql`
			query {
				delegations(orderBy: "id", orderDirection: "desc") {
					items {
						owner
						delegatedTo
					}
				}
			}
		`,
		{ fetchPolicy: "no-cache" }
	);

	if (loading || !data || !data.delegations) {
		return returnData;
	}

	const d = data.delegations.items as PonderDelegationQuery[];

	for (const dd of d) {
		// if (dd.owner.toLowerCase() === dd.delegatedTo.toLowerCase()) continue; // revoked
		const o = dd.owner.toLowerCase() as Address;
		const t = dd.delegatedTo.toLowerCase() as Address;

		if (!returnData.delegaters[o]) returnData.delegaters[o] = [];
		returnData.delegaters[o].push(t);

		if (!returnData.delegatees[t]) returnData.delegatees[t] = [];
		returnData.delegatees[t].push(o);
	}

	return returnData;
};
