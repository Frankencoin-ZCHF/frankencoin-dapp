import { erc20ABI, useAccount, useChainId, useContractReads } from "wagmi";
import { ADDRESS } from "@contracts";
import { ABIS } from "@contracts";
import { decodeBigIntCall } from "@utils";

export const useSwapStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const account = address || "0x0";

  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // XCHF Calls
      {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [account],
      },
      {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: "symbol",
      },
      {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account, ADDRESS[chainId].bridge],
      },
      {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [ADDRESS[chainId].bridge],
      },
      // Frankencoin Calls
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [account],
      },
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: "symbol",
      },
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account, ADDRESS[chainId].bridge],
      },
      // Bridge Calls
      {
        address: ADDRESS[chainId].bridge,
        abi: ABIS.StablecoinBridgeABI,
        functionName: "limit",
      },
    ],
    watch: true,
  });

  const xchfUserBal: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const xchfSymbol: string = data ? String(data[1].result) : "";
  const xchfUserAllowance: bigint = data
    ? decodeBigIntCall(data[2])
    : BigInt(0);
  const xchfBridgeBal: bigint = data ? decodeBigIntCall(data[3]) : BigInt(0);

  const frankenUserBal: bigint = data ? decodeBigIntCall(data[4]) : BigInt(0);
  const frankenSymbol: string = data ? String(data[5].result) : "";
  const frankenUserAllowance: bigint = data
    ? decodeBigIntCall(data[6])
    : BigInt(0);

  const bridgeLimit: bigint = data ? decodeBigIntCall(data[7]) : BigInt(0);

  return {
    xchfUserBal,
    xchfSymbol,
    xchfUserAllowance,
    xchfBridgeBal,

    frankenUserBal,
    frankenSymbol,
    frankenUserAllowance,

    bridgeLimit,
  };
};
