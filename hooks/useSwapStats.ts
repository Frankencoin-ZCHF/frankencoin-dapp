import { erc20ABI, useAccount, useChainId, useContractReads } from "wagmi"
import { ADDRESS } from "../contracts/address";
import { ABIS } from "../contracts/abis";
import { decodeBigIntCall } from "../utils";

export const useSwapStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const account = address || '0x0';

  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // XCHF Calls
      {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [account]
      }, {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: 'symbol',
      }, {
        address: ADDRESS[chainId].xchf,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [account, ADDRESS[chainId].bridge]
      },
      // Frankencoin Calls
      {
        address: ADDRESS[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'balanceOf',
        args: [account]
      }, {
        address: ADDRESS[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'symbol'
      }, {
        address: ADDRESS[chainId].frankenCoin,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [account, ADDRESS[chainId].bridge]
      },
    ],
    watch: true,
  })

  const xchfUserBal: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
  const xchfSymbol: string = data ? String(data[1].result) : '';
  const xchfUserAllowance: bigint = data ? decodeBigIntCall(data[2]) : BigInt(0);

  const frankenUserBal: bigint = data ? decodeBigIntCall(data[3]) : BigInt(0);
  const frankenSymbol: string = data ? String(data[4].result) : '';
  const frankenUserAllowance: bigint = data ? decodeBigIntCall(data[5]) : BigInt(0);

  return {
    xchfUserBal,
    xchfSymbol,
    xchfUserAllowance,

    frankenUserBal,
    frankenSymbol,
    frankenUserAllowance,
  }
}