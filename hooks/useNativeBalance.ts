import { useEffect, useState } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { Address } from "viem";

export function useNativeBalance() {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address as Address,
  });

  return {
    balance: ethBalance?.value || 0n,
    formatted: ethBalance?.formatted || "0",
    symbol: ethBalance?.symbol || "ETH",
    decimals: ethBalance?.decimals || 18,
    refetch: refetchEthBalance,
  };
}