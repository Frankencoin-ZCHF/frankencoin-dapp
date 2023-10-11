import { erc20ABI, useAccount, useChainId, useContractReads } from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { decodeBigIntCall } from "@utils";
import { Address, zeroAddress } from "viem";

export const useGovStats = (helpers?: Address[]) => {
  const chainId = useChainId();
  const { address } = useAccount();

  const equityContract = {
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
  };

  const account = address || zeroAddress;
  const contractCalls: any[] = [
    {
      ...equityContract,
      functionName: "totalVotes",
    },
    {
      ...equityContract,
      functionName: "votes",
      args: [account],
    },
  ];
  helpers?.forEach((helper) => {
    contractCalls.push({
      ...equityContract,
      functionName: "votes",
      args: [helper],
    });
  });

  // Fetch all blockchain stats in one web3 call using multicall
  const { data, isError, isLoading } = useContractReads({
    contracts: contractCalls,
    watch: true,
  });

  const totalVotes: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const userVotes: bigint = data ? decodeBigIntCall(data[1]) : BigInt(0);
  const delegatedFrom: { owner: Address; votes: bigint }[] = [];
  let userTotalVotes = userVotes;
  helpers?.forEach((helper, i) => {
    const delegatorVotes = data ? decodeBigIntCall(data[i + 2]) : BigInt(0);
    delegatedFrom.push({
      owner: helper,
      votes: delegatorVotes,
    });
    userTotalVotes += delegatorVotes;
  });

  return {
    totalVotes,
    userVotes,
    userTotalVotes,
    delegatedFrom,
  };
};
