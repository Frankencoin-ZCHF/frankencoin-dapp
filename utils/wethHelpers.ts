import { Address } from "viem";

// WETH contract addresses per chain
export const WETH_ADDRESSES: Record<number, Address> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Mainnet
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // Polygon (WMATIC)
  // Add more chains as needed
};

// WETH ABI - minimal interface for deposit/withdraw
export const WETH_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function getWethAddress(chainId: number): Address | undefined {
  return WETH_ADDRESSES[chainId];
}

export function isWethToken(address: Address, chainId: number): boolean {
  const wethAddress = getWethAddress(chainId);
  return wethAddress ? address.toLowerCase() === wethAddress.toLowerCase() : false;
}