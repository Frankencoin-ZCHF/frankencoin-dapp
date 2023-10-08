import { erc20ABI, useAccount, useChainId, useContractReads } from "wagmi";
import { ADDRESS } from "@contracts";
import { decodeBigIntCall } from "@utils";

export const useFaucetStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const volContract = {
    address: ADDRESS[chainId].mockVol,
    abi: erc20ABI,
  };

  const xchfContract = {
    address: ADDRESS[chainId].xchf,
    abi: erc20ABI,
  };

  const account = address || "0x0";

  // Fetch all blockchain stats in one web3 call using multicall
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // Frankencoin Calls
      {
        ...xchfContract,
        functionName: "symbol",
      },
      {
        ...xchfContract,
        functionName: "balanceOf",
        args: [account],
      },
      {
        ...xchfContract,
        functionName: "decimals",
      },
      // XCHF Calls
      {
        ...volContract,
        functionName: "symbol",
      },
      {
        ...volContract,
        functionName: "balanceOf",
        args: [account],
      },
      {
        ...volContract,
        functionName: "decimals",
      },
    ],
    watch: true,
  });

  const xchfSymbol: string = data ? String(data[0].result) : "";
  const xchfUserBal: bigint = data ? decodeBigIntCall(data[1]) : BigInt(0);
  const xchfDecimals: bigint = data ? decodeBigIntCall(data[2]) : BigInt(0);

  const volSymbol: string = data ? String(data[3].result) : "";
  const volUserBal: bigint = data ? decodeBigIntCall(data[4]) : BigInt(0);
  const volDecimals: bigint = data ? decodeBigIntCall(data[5]) : BigInt(0);

  return {
    xchfUserBal,
    xchfDecimals,
    xchfSymbol,

    volSymbol,
    volUserBal,
    volDecimals,
  };
};
