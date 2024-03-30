import {
  useAccount,
  useChainId,
  useContractReads,
} from "wagmi";
import { ADDRESS } from "@contracts";
import { ABIS } from "@contracts";
import { decodeBigIntCall } from "@utils";

export const useUserBalance = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const frankenContract = {
    address: ADDRESS[chainId].frankenCoin,
    abi: ABIS.FrankencoinABI,
  } as const;

  const equityContract = {
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
  };

  const account = address || "0x0";

  // Fetch all blockchain stats in one web3 call using multicall
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // Frankencoin Calls
      {
        ...frankenContract,
        functionName: "balanceOf",
        args: [account],
      },
      {
        ...equityContract,
        functionName: "balanceOf",
        args: [account],
      }
    ],
  });

  const frankenBalance: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const equityBalance: bigint = data ? decodeBigIntCall(data[1]) : BigInt(0);

  return {
    frankenBalance,
    equityBalance,
  };
};
