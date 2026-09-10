import { ADDRESS, BridgedGovernanceABI, BridgedVotesABI, EquityABI, MainnetVotesABI, ChainIdSide } from "@frankencoin/zchf";
import { useReadContracts } from "wagmi";
import { Address, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { VotingSystem } from "./useDelegationQuery";

export type VotesSynced = {
	syncedVotes: bigint;
	totalVotes: bigint;
};

// FPS1 sync lands on ccipBridgedGovernance (BridgedGovernanceABI); FCS sync lands on bridgedVotes
// (BridgedVotesABI) — same votesDelegated/totalVotes shape either way, different contract per system.
export const useVotesSynced = (address: Address, helpers: Address[], targetChainId: number, system: VotingSystem = "fps1"): VotesSynced => {
	const isEnabled = address !== zeroAddress && targetChainId !== mainnet.id;

	const bridgedContract =
		system === "fcs"
			? { address: ADDRESS[targetChainId as ChainIdSide].bridgedVotes, abi: BridgedVotesABI }
			: { address: ADDRESS[targetChainId as ChainIdSide].ccipBridgedGovernance, abi: BridgedGovernanceABI };

	const mainnetContract =
		system === "fcs"
			? { address: ADDRESS[mainnet.id].mainnetVotes, abi: MainnetVotesABI }
			: { address: ADDRESS[mainnet.id].equity, abi: EquityABI };

	const { data } = useReadContracts({
		contracts: [
			{
				...bridgedContract,
				chainId: targetChainId,
				functionName: "votesDelegated" as const,
				args: [address, helpers] as [Address, Address[]],
			},
			{
				...mainnetContract,
				chainId: mainnet.id,
				functionName: "totalVotes" as const,
				args: [] as [],
			},
		] as any,
		query: { enabled: isEnabled },
	});

	return {
		syncedVotes: (data?.[0]?.result as bigint) ?? 0n,
		totalVotes: (data?.[1]?.result as bigint) ?? 0n,
	};
};
