import { useReadContracts } from "wagmi";
import { FPSHolder } from "./useFPSHolders";
import { decodeBigIntCall } from "../utils/format";
import { WAGMI_CHAIN } from "../app.config";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import { Address } from "viem";

export type VoteDataQuote = {
	holder: Address;
	fps: bigint;
	votingPower: bigint;
	holdingDuration: bigint;
};

export const useVotingPowers = (holders: FPSHolder[]) => {
	let contractCalls: any[] = [];
	holders.forEach((holder) => {
		contractCalls.push({
			address: ADDRESS[WAGMI_CHAIN.id].equity,
			abi: EquityABI,
			functionName: "votes",
			args: [holder.address],
		});
	});

	holders.forEach((holder) => {
		contractCalls.push({
			address: ADDRESS[WAGMI_CHAIN.id].equity,
			abi: EquityABI,
			functionName: "holdingDuration",
			args: [holder.address],
		});
	});

	contractCalls.push({
		address: ADDRESS[WAGMI_CHAIN.id].equity,
		abi: EquityABI,
		functionName: "totalVotes",
	});

	const { data } = useReadContracts({
		contracts: contractCalls,
	});

	const votesData: VoteDataQuote[] = [];
	if (data) {
		for (let i = 0; i < holders.length; i += 2) {
			votesData.push({
				holder: holders[i].address,
				fps: holders[i].votingPower,
				votingPower: data[i].result as bigint,
				holdingDuration: data[holders.length + i].result as bigint,
			});
		}
	}

	const totalVotes = data ? decodeBigIntCall(data.at(-1)) : 0n;

	votesData.sort((a, b) => (a.votingPower > b.votingPower ? -1 : 1));

	return { votesData, totalVotes };
};
