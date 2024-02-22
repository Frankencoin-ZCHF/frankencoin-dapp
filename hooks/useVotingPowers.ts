import { Address, mainnet, useContractReads } from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { FPSHolder } from "./useFPSHolders";
import { decodeBigIntCall } from "../utils/format";

export const useVotingPowers = (holders: FPSHolder[]) => {
  let contractCalls: any[] = [];
  holders.forEach((holder) => {
    contractCalls.push({
      address: ADDRESS[mainnet.id].equity,
      abi: ABIS.EquityABI,
      functionName: "votes",
      args: [holder.address],
    });
  });
  contractCalls.push({
    address: ADDRESS[mainnet.id].equity,
    abi: ABIS.EquityABI,
    functionName: "totalVotes",
  });

  const { data } = useContractReads({
    contracts: contractCalls,
    watch: true,
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
