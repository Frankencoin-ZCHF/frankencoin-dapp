import { Address } from "viem";
import { useVotingPowers } from "./useVotingPowers";
import { useDelegationHelpers } from "./useDelegationHelpers";
import { QUORUM_RATIO, VotingSystem } from "./useDelegationQuery";

export type QualifiedVotingSystem = {
	system: VotingSystem; // which system this wallet should act through
	isQualified: boolean; // whether it qualifies via either system at all
	helpers: Address[]; // delegators for `system`, ready to pass as the on-chain `helpers` arg
	isLoading: boolean;
};

// Same FPS-first-then-FCS-fallback logic as GuardQualifiedVoter, but also resolves which system's
// contract path + helpers list a write action should actually use — the two can't be decided separately:
// `helpers` must be real delegators on the *same* governance ledger as the contract being called
// (Equity vs MainnetVotes/BridgedVotes), or the on-chain checkQualified call reverts.
export const useQualifiedVotingSystem = (address?: Address): QualifiedVotingSystem => {
	const fps = useVotingPowers("fps");
	const fcs = useVotingPowers("fcs");

	const fpsRatio = (fps.accountVoteData?.votingPowerRatio ?? 0) + (fps.accountVoteData?.supportedVotingPowerRatio ?? 0);
	const fcsRatio = (fcs.accountVoteData?.votingPowerRatio ?? 0) + (fcs.accountVoteData?.supportedVotingPowerRatio ?? 0);

	const isFpsQualified = fpsRatio >= QUORUM_RATIO.fps;
	const isFcsQualified = fcsRatio >= QUORUM_RATIO.fcs;

	// FPS is the default/primary system; FCS is only used when FPS alone doesn't qualify.
	const system: VotingSystem = isFpsQualified || !isFcsQualified ? "fps" : "fcs";
	const { helpers } = useDelegationHelpers(address, system);

	return {
		system,
		isQualified: isFpsQualified || isFcsQualified,
		helpers,
		isLoading: fps.isLoading || fcs.isLoading,
	};
};
