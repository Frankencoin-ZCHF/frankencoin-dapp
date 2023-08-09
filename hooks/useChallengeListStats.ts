import { Address } from "viem";
import { useChainId, useContractReads } from "wagmi";
import { ABIS, ADDRESS } from "../contracts";
import { ChallengeQuery } from "./useChallengeList";

export interface Challenge {
  challenger: Address
  position: Address
  size: bigint
  index: bigint
  bid: bigint
  bidder: Address
  end: bigint
  status: string
}

export const useChallengeListStats = (challenges: ChallengeQuery[]): Challenge[] => {
  const chainId = useChainId()

  const { data } = useContractReads({
    contracts: challenges.map(challenge => {
      return {
        address: ADDRESS[chainId].mintingHub,
        abi: ABIS.MintingHubABI,
        functionName: 'challenges',
        args: [challenge.number]
      }
    }),
    enabled: challenges.length > 0,
    watch: true
  })

  const challengsData: Challenge[] = [];
  if (data) {
    data.forEach((challenge, i) => {
      const result: any[] = challenge.result as any[]
      const end = BigInt(result[3])
      const bidder = result[4]
      const bid = BigInt(result[5])
      challengsData.push({
        challenger: challenges[i].challenger,
        position: challenges[i].position,
        size: challenges[i].size,
        index: challenges[i].number,
        bid,
        bidder,
        end,
        status: challenges[i].status
      })
    })
  }

  return challengsData;
}