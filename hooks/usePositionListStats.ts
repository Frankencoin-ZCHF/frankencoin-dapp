import { Address, useContractReads } from "wagmi";
import { ABIS, ADDRESS } from "../contracts";

export const usePositionListStats = (positions: Address[]) => {
  let contractCalls: any[] = [];
  positions.forEach(position => {
    const positionContract = {
      address: position,
      abi: ABIS.PositionABI,
    }
    contractCalls = contractCalls.concat([
      {
        ...positionContract,
        functionName: 'owner'
      }, {
        ...positionContract,
        functionName: 'collateral'
      }, {
        ...positionContract,
        functionName: 'expiration'
      }
    ])
  })

  const { data } = useContractReads({
    contracts: contractCalls,
    watch: true,
  })

  const positionData: any[] = [];
  if (data) {
    positions.forEach((pos, i) => {
      const index = i * 3;
      const owner = data[index].result
      const collateral = data[index + 1].result

      positionData.push({
        position: pos,
        owner,
        collateral,
      })
    })
  }

  return positionData;
}