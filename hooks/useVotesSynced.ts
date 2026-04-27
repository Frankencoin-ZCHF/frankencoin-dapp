import { ADDRESS, BridgedGovernanceABI, EquityABI, ChainIdSide } from "@frankencoin/zchf";
import { useReadContracts } from "wagmi";
import { Address, zeroAddress } from "viem";
import { mainnet } from "viem/chains";

export type VotesSynced = {
	syncedVotes: bigint;
	totalVotes: bigint;
};

export const useVotesSynced = (address: Address, helpers: Address[], targetChainId: number): VotesSynced => {
	const isEnabled = address !== zeroAddress && targetChainId !== mainnet.id;

	const { data } = useReadContracts({
		contracts: [
			{
				address: ADDRESS[targetChainId as ChainIdSide].ccipBridgedGovernance,
				chainId: targetChainId,
				abi: BridgedGovernanceABI,
				functionName: "votesDelegated" as const,
				args: [address, helpers] as [Address, Address[]],
			},
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "totalVotes" as const,
				args: [] as [],
			},
		],
		query: { enabled: isEnabled },
	});

	return {
		syncedVotes: (data?.[0]?.result as bigint) ?? 0n,
		totalVotes: (data?.[1]?.result as bigint) ?? 0n,
	};
};
