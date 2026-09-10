import { useConnection, useReadContracts } from "wagmi";
import { useFPSHolders } from "./useFPSHolders";
import { useDelegationQuery, VotingSystem } from "./useDelegationQuery";
import { collectHelpers } from "./useDelegationHelpers";
import { decodeBigIntCall, normalizeAddress } from "../utils/format";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { Address } from "viem";
import { mainnet } from "viem/chains";

export type VoteDataQuote = {
	holder: Address;
	balance: bigint;
	votingPower: bigint;
	votingPowerRatio: number;
	holdingDuration: bigint;
	supporters: Address[];
	supportedVotingPower: bigint;
	supportedVotingPowerRatio: number;
};

// Raw FCS vote/balance reads go straight to the FCS token (AccumulatingVotesToken exposes the same
// votes/holdingDuration/balanceOf/totalVotes shape as Equity) — only the *delegation graph* lives
// elsewhere, on MainnetVotes (see useDelegationQuery).
const VOTING_SYSTEM_CONTRACT = {
	fps1: { address: ADDRESS[mainnet.id].equity, abi: EquityABI },
	fcs: { address: ADDRESS[mainnet.id].fcs, abi: FCSABI },
} as const;

export const useVotingPowers = (system: VotingSystem = "fps1") => {
	const { address } = useConnection();
	const { address: tokenAddress, abi } = VOTING_SYSTEM_CONTRACT[system];
	const votingContract = { address: tokenAddress, chainId: mainnet.id, abi } as const;

	const { holders } = useFPSHolders(tokenAddress);
	const { allOwners, allDelegatees, delegatees } = useDelegationQuery(system);

	// Deduplicated address list: connected wallet + FPS holders + delegation owners + delegatees
	const seen = new Set<Address>();
	const allAddresses: Address[] = [];
	if (address) {
		seen.add(normalizeAddress(address));
		allAddresses.push(normalizeAddress(address));
	}
	for (const h of holders) {
		const normalized = normalizeAddress(h.account);
		if (!seen.has(normalized)) {
			seen.add(normalized);
			allAddresses.push(normalized);
		}
	}
	for (const addr of [...allOwners, ...allDelegatees]) {
		const normalized = normalizeAddress(addr);
		if (!seen.has(normalized)) {
			seen.add(normalized);
			allAddresses.push(normalized);
		}
	}

	const n = allAddresses.length;

	const contractCalls = [
		{ ...votingContract, functionName: "totalVotes" as const },
		...allAddresses.map((addr) => ({ ...votingContract, functionName: "votes" as const, args: [addr] as [Address] })),
		...allAddresses.map((addr) => ({ ...votingContract, functionName: "holdingDuration" as const, args: [addr] as [Address] })),
		...allAddresses.map((addr) => ({ ...votingContract, functionName: "balanceOf" as const, args: [addr] as [Address] })),
	];

	const { data, isLoading } = useReadContracts({ contracts: contractCalls });

	const totalVotes: bigint = data ? decodeBigIntCall(data[0]) : 0n;

	// First pass: build votingPower map for supporter aggregation
	const votePowerMap = new Map<Address, bigint>();
	if (data) {
		for (let i = 0; i < n; i++) {
			votePowerMap.set(allAddresses[i], decodeBigIntCall(data[1 + i]));
		}
	}

	// Second pass: assemble full VoteDataQuote
	const votesData: VoteDataQuote[] = [];
	if (data) {
		for (let i = 0; i < n; i++) {
			const addr = allAddresses[i];
			const supporters: Address[] = collectHelpers(addr, delegatees);
			const supportedVotingPower = supporters.reduce((sum, s) => sum + (votePowerMap.get(normalizeAddress(s)) ?? 0n), 0n);

			const votingPower = votePowerMap.get(addr) ?? 0n;

			votesData.push({
				holder: addr,
				balance: decodeBigIntCall(data[1 + 2 * n + i]),
				votingPower,
				votingPowerRatio: totalVotes > 0n ? Number(votingPower) / Number(totalVotes) : 0,
				holdingDuration: decodeBigIntCall(data[1 + n + i]),
				supporters,
				supportedVotingPower,
				supportedVotingPowerRatio: totalVotes > 0n ? Number(supportedVotingPower) / Number(totalVotes) : 0,
			});
		}
	}

	votesData.sort((a, b) => (a.votingPower > b.votingPower ? -1 : 1));

	const accountVoteData = address ? votesData.find((v) => normalizeAddress(v.holder) === normalizeAddress(address)) ?? null : null;

	return { votesData, totalVotes, isLoading, accountVoteData };
};
