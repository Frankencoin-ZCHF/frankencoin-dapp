import { useReadContracts } from "wagmi";
import { FPSHolder } from "./useFPSHolders";
import { decodeBigIntCall } from "../utils/format";
import { WAGMI_CHAIN } from "../app.config";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";

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
	contractCalls.push({
		address: ADDRESS[WAGMI_CHAIN.id].equity,
		abi: EquityABI,
		functionName: "totalVotes",
	});

	const { data } = useReadContracts({
		contracts: contractCalls,
	});

	const votesData: any[] = [];
	if (data) {
		holders.forEach((holder, i) => {
			votesData.push({
				holder: holder.address,
				fps: holder.votingPower,
				votingPower: data[i].result,
			});
		});
	}

	const totalVotes = data ? decodeBigIntCall(data[holders.length]) : 0n;

	votesData.sort((a, b) => (a.votingPower > b.votingPower ? -1 : 1));

	return { votesData, totalVotes };
};
