import { Address, zeroAddress } from "viem";
import { useChainId, useContractEvent, useContractReads } from "wagmi";
import { useState } from "react";
import { ABIS, ADDRESS } from "../contracts";
import { decodeBigIntCall } from "../utils";

interface ChallengeEvent {
  challenger: Address
  size: bigint
  index: bigint
}

export const useChallengeListStats = (position: Address) => {
  const chainId = useChainId()
  const [logs, setLogs] = useState<ChallengeEvent[]>([])
  const unwatch = useContractEvent({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    eventName: 'ChallengeStarted',
    listener(logs) {
      setLogs(logs.filter(log => log.args.position === position)
        .map(log => {
          return {
            challenger: log.args.challenger || zeroAddress,
            size: log.args.size || 0n,
            index: log.args.number || 0n
          }
        }))
      // unwatch?.()
    }
  })

  const { data } = useContractReads({
    contracts: logs.map(log => {
      return {
        address: ADDRESS[chainId].mintingHub,
        abi: ABIS.MintingHubABI,
        functionName: 'challenges',
        args: [log.index]
      }
    }),
    enabled: logs.length > 0,
    watch: true
  })

  console.log(logs, data)

  const challengsData: any[] = [];
  if (data) {
    data.forEach((challenge, i) => {
      const result: any[] = challenge.result as any[]
      const end = BigInt(result[3])
      const bidder = result[4]
      const bid = BigInt(result[5])
      challengsData.push({
        position,
        challenger: logs[i].challenger,
        size: logs[i].size,
        index: logs[i].index,
        bid,
        bidder,
        end,
      })
    })
  }

  console.log(challengsData)

  return challengsData;
}