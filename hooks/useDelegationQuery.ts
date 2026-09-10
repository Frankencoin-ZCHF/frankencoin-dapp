import { gql, useQuery } from "@apollo/client";
import { Address, zeroAddress } from "viem";
import { normalizeAddress } from "../utils/format";

export type VotingSystem = "fps" | "fcs";

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
	allOwners: Address[];
	allDelegatees: Address[];
};

// FPS delegation lives on the Equity token itself. FCS delegation instead lives on MainnetVotes/
// BridgedVotes (a separate governance-helper contract, not the FCS token) — ponder indexes it into
// fCSDelegations, keyed by chainId since it's synced across chains; mainnet is the qualification-gating
// source of truth, so that's what this filters to.
const EQUITY_DELEGATIONS_QUERY = gql`
	{
		equityDelegations {
			items {
				owner
				delegatedTo
			}
		}
	}
`;

const FCS_DELEGATIONS_QUERY = gql`
	{
		fCSDelegations(where: { chainId: 1 }) {
			items {
				owner
				delegatedTo
			}
		}
	}
`;

export const useDelegationQuery = (system: VotingSystem = "fps"): DelegationQuery => {
	const returnData: DelegationQuery = {
		owners: {},
		delegatees: {},
		allOwners: [],
		allDelegatees: [],
	};

	const { data, loading } = useQuery(system === "fcs" ? FCS_DELEGATIONS_QUERY : EQUITY_DELEGATIONS_QUERY, {
		fetchPolicy: "cache-first",
	});

	const items: PonderDelegationQuery[] | undefined = system === "fcs" ? data?.fCSDelegations?.items : data?.equityDelegations?.items;

	if (loading || !items) {
		return returnData;
	}

	for (const i of items) {
		const owner = normalizeAddress(i.owner);
		const to = normalizeAddress(i.delegatedTo);

		returnData.owners[owner] = to;
		returnData.allOwners.push(owner);

		if (!returnData.delegatees[to]) returnData.delegatees[to] = [];
		returnData.delegatees[to].push(owner);

		if (!returnData.allDelegatees.includes(to)) returnData.allDelegatees.push(to);
	}

	return returnData;
};
