import { useChainId, useContractRead } from "wagmi";
import { ABIS, ADDRESS } from "../contracts";
import { decodeBigIntCall } from "../utils";
import { getAddress, zeroAddress } from "viem";

export const useChallengeStats = (number: bigint) => {
  const chainId = useChainId()

  const { data } = useContractRead({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: 'challenges',
    args: [number]
  })

  const end = data ? decodeBigIntCall(data[3]) : 0n;
  const bidder = data ? getAddress(data[4]) : zeroAddress;
  const bid = data ? decodeBigIntCall(data[5]) : 0n;

  return {
    bid,
    bidder,
    end,
  }
}