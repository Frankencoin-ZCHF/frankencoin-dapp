import { erc20ABI, useAccount, useChainId, useContractRead, useContractReads, useToken } from "wagmi";
import { Address } from "../contracts/address";
import { ABIS } from "../contracts/abis";
import { ethers } from "ethers";

// declare const equityABI: readonly [
//   {
//     readonly type: "function";
//     readonly name: "price";
//     readonly stateMutability: "view";
//     readonly inputs: readonly [];
//     readonly outputs: readonly [{
//       readonly name: "";
//       readonly type: "uint256";
//     }];
//   },
// ]
export const useHomeStats = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  // Fetch all blockchain stats in one web3 call using multicall
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      // FrankenCoin Calls
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'totalSupply'
      },
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'symbol'
      },
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'balanceOf',
        args: [address || ethers.ZeroAddress]
      },
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'equity',
      },
      {
        address: Address[chainId].frankenCoin,
        abi: ABIS.FrankenCoinABI,
        functionName: 'minterReserve',
      },
      // XCHF Calls
      {
        address: Address[chainId].xchf,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [Address[chainId].bridge]
      },
      {
        address: Address[chainId].xchf,
        abi: erc20ABI,
        functionName: 'symbol',
      },
      // Equity Calls
      {
        address: Address[chainId].equity,
        abi: ABIS.EquityABI,
        functionName: 'price',
      },
      {
        address: Address[chainId].equity,
        abi: ABIS.EquityABI,
        functionName: 'totalSupply',
      },
      {
        address: Address[chainId].equity,
        abi: ABIS.EquityABI,
        functionName: 'balanceOf',
        args: [address || ethers.ZeroAddress]
      },
      {
        address: Address[chainId].equity,
        abi: ABIS.EquityABI,
        functionName: 'totalVotes',
      },
      {
        address: Address[chainId].equity,
        abi: ABIS.EquityABI,
        functionName: 'votes',
        args: [address || ethers.ZeroAddress]
      },
    ]
  })

  const frankenTotalSupply: bigint = data ? BigInt(String(data[0].result)) : BigInt(0);
  const frankenSymbol: string = data ? String(data[1].result) : '';
  const frankenBalance: bigint = data ? BigInt(String(data[2].result)) : BigInt(0);
  const frankenEquity: bigint = data ? BigInt(String(data[3].result)) : BigInt(0);
  const frankenMinterReserve: bigint = data ? BigInt(String(data[4].result)) : BigInt(0);

  const xchfBridgeBal: bigint = data ? BigInt(String(data[5].result)) : BigInt(0);
  const xchfSymbol: string = data ? String(data[6].result) : '';

  const equityPrice: bigint = data ? BigInt(String(data[7].result)) : BigInt(0);
  const equityTotalSupply: bigint = data ? BigInt(String(data[8].result)) : BigInt(0);
  const equityMarketCap: bigint = equityPrice * equityTotalSupply / BigInt(1e18);
  const equityBalance: bigint = data ? BigInt(String(data[9].result)) : BigInt(0);
  const equityTotalVotes: bigint = data ? BigInt(String(data[10].result)) : BigInt(0);
  const equityUserVotes: bigint = data ? BigInt(String(data[11].result)) : BigInt(0);

  return {
    frankenTotalSupply,
    frankenSymbol,
    frankenBalance,
    frankenEquity,
    frankenMinterReserve,

    xchfBridgeBal,
    xchfSymbol,

    equityPrice,
    equityTotalSupply,
    equityMarketCap,
    equityBalance,
    equityTotalVotes,
    equityUserVotes
  }
}
