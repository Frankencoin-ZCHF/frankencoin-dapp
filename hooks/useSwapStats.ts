import { erc20ABI, useAccount, useChainId, useContractReads } from "wagmi"
import { Address } from "../contracts/address";
import { ethers, } from "ethers";
import { ABIS } from "../contracts/abis";

export const useSwapStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const account = address ? address : ethers.ZeroAddress;

  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // XCHF Calls
      {
        address: Address[chainId].xchf,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [account]
      }, {
        address: Address[chainId].xchf,
        abi: erc20ABI,
        functionName: 'symbol',
      },
      // Frankencoin Calls
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'balanceOf',
        args: [address || ethers.ZeroAddress]
      }, {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'symbol'
      },
    ]
  })

  const xchfUserBal: bigint = data ? BigInt(String(data[0].result)) : BigInt(0);
  const xchfSymbol: string = data ? String(data[1].result) : '';

  const frankenUserBal: bigint = data ? BigInt(String(data[2].result)) : BigInt(0);
  const frankenSymbol: string = data ? String(data[3].result) : '';

  return {
    xchfUserBal,
    xchfSymbol,

    frankenUserBal,
    frankenSymbol,
  }
}