import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { Address, zeroAddress } from "viem";
import { normalizeAddress } from "../utils/format";
import { fetchAllPonderPages } from "../utils/ponderPagination";
import { PONDER_CLIENT } from "../app.config";

export type VotingSystem = "fps" | "fcs";

// Real on-chain quorum per system (Governance.sol: QUORUM = 200 on the already-deployed, immutable FPS
// Equity contract = 2%, vs 100 on FCS's freshly-deployed MainnetVotes/BridgedVotes = 1%). Single source
// of truth — both the display cutoff on the voters table and the actual qualification gate key off this.
export const QUORUM_RATIO: Record<VotingSystem, number> = {
	fps: 0.02,
	fcs: 0.01,
};

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
	query ($after: String) {
		equityDelegations(after: $after) {
			items {
				owner
				delegatedTo
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const FCS_DELEGATIONS_QUERY = gql`
	query ($after: String) {
		fCSDelegations(where: { chainId: 1 }, after: $after) {
			items {
				owner
				delegatedTo
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

const EMPTY: DelegationQuery = {
	owners: {},
	delegatees: {},
	allOwners: [],
	allDelegatees: [],
};

export const useDelegationQuery = (system: VotingSystem = "fps"): DelegationQuery => {
	const [returnData, setReturnData] = useState<DelegationQuery>(EMPTY);

	useEffect(() => {
		let cancelled = false;

		const query = system === "fcs" ? FCS_DELEGATIONS_QUERY : EQUITY_DELEGATIONS_QUERY;
		const rootField = system === "fcs" ? "fCSDelegations" : "equityDelegations";

		fetchAllPonderPages<PonderDelegationQuery>(PONDER_CLIENT, query, rootField)
			.then((items) => {
				if (cancelled) return;

				const next: DelegationQuery = { owners: {}, delegatees: {}, allOwners: [], allDelegatees: [] };

				for (const i of items) {
					const owner = normalizeAddress(i.owner);
					const to = normalizeAddress(i.delegatedTo);

					next.owners[owner] = to;
					next.allOwners.push(owner);

					if (!next.delegatees[to]) next.delegatees[to] = [];
					next.delegatees[to].push(owner);

					if (!next.allDelegatees.includes(to)) next.allDelegatees.push(to);
				}

				setReturnData(next);
			})
			.catch((error) => {
				console.error("Failed to fetch delegations", error);
			});

		return () => {
			cancelled = true;
		};
	}, [system]);

	return returnData;
};
