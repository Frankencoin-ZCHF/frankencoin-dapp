import { useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { VotingSystem } from "./useDelegationQuery";

// Governance.sol: QUORUM = 200 (2%) on the already-deployed FPS Equity contract (immutable, predates
// the rename), vs. 100 (1%) on FCS's freshly-deployed MainnetVotes/BridgedVotes.
const QUORUM_BPS: Record<VotingSystem, bigint> = {
	fps: 200n,
	fcs: 100n,
};

const VOTING_SYSTEM_CONTRACT = {
	fps: { address: ADDRESS[mainnet.id].equity, abi: EquityABI },
	fcs: { address: ADDRESS[mainnet.id].fcs, abi: FCSABI },
} as const;

export const useFPSAverageStats = (system: VotingSystem = "fps") => {
	const { address, abi } = VOTING_SYSTEM_CONTRACT[system];
	const votingContract = { address, chainId: mainnet.id, abi } as const;

	const { data } = useReadContracts({
		contracts: [
			{
				...votingContract,
				functionName: "totalSupply",
			},
			{
				...votingContract,
				functionName: "totalVotes",
			},
		],
	});

	const totalSupply: bigint = data ? decodeBigIntCall(data[0]) : 0n;
	const totalVotes: bigint = data ? decodeBigIntCall(data[1]) : 0n;

	const avgHoldingDuration: bigint = totalSupply > 0n ? (totalVotes / totalSupply) >> 20n : 0n;
	const fpsForVeto: bigint = (totalSupply * QUORUM_BPS[system]) / 10000n;

	return {
		avgHoldingDuration,
		fpsForVeto,
	};
};
