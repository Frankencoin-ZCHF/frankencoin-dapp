import { Address, zeroAddress } from "viem";
import ChallengeRow from "./ChallengeRow";
import { useChallengeListStats } from "../../hooks";

interface Props {
  position: Address
  positionPrice: bigint,
  collateralDecimal: number
  collateralSymbol: string
}

export default function ChallengeTable({
  position,
  positionPrice,
  collateralDecimal,
  collateralSymbol,
}: Props) {
  const challengeStats = useChallengeListStats(position)

  return (
    <section>
      <div className="space-y-3">
        <div
          className="hidden items-center justify-between rounded-lg bg-white py-5 px-8 md:flex xl:px-16"
        >
          <div className="hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-5">
            <span className="leading-tight">Auctionated Collateral</span>
            <span className="leading-tight">Highest Bid</span>
            <span className="leading-tight">Buy now Price</span>
            <span className="leading-tight">Owner</span>
            <span className="leading-tight">State</span>
          </div>
          <div className="w-40 flex-shrink-0"></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:gap-2">
          {challengeStats.map(challenge => (
            <ChallengeRow
              position={position}
              challenger={challenge.challenger}
              challengeSize={challenge.size}
              bid={challenge.bid}
              end={challenge.end}
              collateralDecimal={collateralDecimal}
              collateralSymbol={collateralSymbol}
              positionPrice={positionPrice}
              index={challenge.index}
              key={Number(challenge.index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}