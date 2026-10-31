import { useReadContracts } from "wagmi";
import { Address } from "viem";
import { ADDRESS, ChainId, MinterGovernanceABI } from "@frankencoin/zchf";

export type UnannouncedMinter = {
	// true once confirmed on-chain that the minter was applied for directly on Frankencoin, bypassing MinterGovernance.suggestMinter
	isUnannounced: boolean;
	// ZCHF paid to whoever calls MinterGovernance.denyUnannouncedMinter (10% of the reward pool)
	reward: bigint;
	isLoading: boolean;
};

// @dev: unannounced minters can be vetoed by anyone through denyUnannouncedMinter, no voting power needed
export const useUnannouncedMinter = (minter: Address, chainId: ChainId, enabled: boolean = true): UnannouncedMinter => {
	const minterGovernance = (ADDRESS as any)[chainId]?.minterGovernance as Address | undefined;

	const { data, isLoading } = useReadContracts({
		contracts: [
			{ address: minterGovernance, chainId, abi: MinterGovernanceABI, functionName: "announcements", args: [minter] },
			{ address: minterGovernance, chainId, abi: MinterGovernanceABI, functionName: "checkReward", args: [minter] },
		],
		query: { enabled: enabled && !!minterGovernance },
	});

	const announcement = data?.[0];
	const reward = data?.[1];

	return {
		isUnannounced: announcement?.status === "success" && announcement.result === 0n,
		reward: reward?.status === "success" ? reward.result : 0n,
		isLoading,
	};
};
