import { Address, useAccount, useChainId, useContractEvent } from "wagmi"
import { ABIS, ADDRESS } from "../../contracts"
import { useState } from "react";
import { usePositionListStats } from "../../hooks";
import PositionRow from "./PositionRow";

interface Props {
  showMyPos?: boolean
}

export default function PositionTable({
  showMyPos
}: Props) {
  const { address } = useAccount()
  const chainId = useChainId();
  const [positions, setPositions] = useState<Address[]>([]);
  const positionStats = usePositionListStats(positions)

  const unwatch = useContractEvent({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    eventName: 'PositionOpened',
    listener(logs) {
      console.log(logs)
      setPositions(logs.filter(log => showMyPos ?
        log.args.owner == address :
        log.args.owner != address
      ).map(log => log.args.position || '0x0'))
      // unwatch?.()
    }
  })

  return (
    <section>
      <div className="space-y-3">
        <div
          className="hidden items-center justify-between rounded-lg bg-white py-5 px-8 md:flex xl:px-16"
        >
          <div className="hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-4">
            <span className="leading-tight">Collateral</span>
            <span className="leading-tight">Liquidation Price</span>
            <span className="leading-tight">Available Amount</span>
            <span className="leading-tight">Expiration Date</span>
          </div>
          <div className="w-40 flex-shrink-0"></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:gap-2">
          {positionStats.map(pos => (
            <PositionRow
              position={pos.position}
              collateral={pos.collateral}
              key={pos.position}
            />
          ))}
          {positions.length == 0 &&
            <div className="rounded-lg bg-white p-8 xl:px-16">
              <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
                {showMyPos ? "You don't have positions." : 'There are no positions yet.'}
              </div>
            </div>
          }
        </div>
      </div >
    </section >
  )
}