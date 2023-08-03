import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import { usePositionStats } from "../../hooks";
import { formatDate } from "../../utils";
import Link from "next/link";

interface Props {
  position: Address
  collateral: Address
}

export default function PositionRow({
  position,
  collateral
}: Props) {
  const positionStats = usePositionStats(position, collateral)

  return (
    <div className="rounded-lg bg-white p-8 xl:px-16">
      <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
        <div className="grid flex-grow grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-gray-400 md:hidden">Collateral</div>
            <DisplayAmount
              amount={positionStats.collateralBal}
              currency={positionStats.collateralSymbol}
              digits={positionStats.collateralDecimal}
            />
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Liquidation Price</div>
            <DisplayAmount
              amount={positionStats.liqPrice}
              currency={"ZCHF"}
            />
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Available Amount</div>
            <DisplayAmount
              amount={positionStats.available}
              currency={"ZCHF"}
            />
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Expiration Date</div>
            <b>{formatDate(positionStats.expiration)}</b>
          </div>
        </div>
        <div className="flex-shrink-0 md:w-40">
          <Link href={`/position/${position}`} className="btn btn-primary px-2 py-1 md:px-3 md:py-1 text-sm w-full">Details</Link>
        </div>
      </div>
    </div>
  )
}