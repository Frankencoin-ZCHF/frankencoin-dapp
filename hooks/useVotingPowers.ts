import { Address, mainnet, useContractReads } from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { FPSHolder } from "./useFPSHolders";

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

  votesData.sort((a, b) => (a.votingPower > b.votingPower ? -1 : 1));

  return votesData;
};
