import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import { usePositionStats } from "@hooks";
import { formatDate } from "@utils";
import Link from "next/link";
import TableRow from "../Table/TableRow";

interface Props {
  position: Address;
  collateral: Address;
}

export default function PositionRow({ position, collateral }: Props) {
  const positionStats = usePositionStats(position, collateral);

  return (
    <TableRow link={`/position/${position}`}>
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
        <DisplayAmount amount={positionStats.liqPrice} currency={"ZCHF"} />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Available Amount</div>
        <DisplayAmount amount={positionStats.available} currency={"ZCHF"} />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Expiration Date</div>
        <b>{formatDate(positionStats.expiration)}</b>
      </div>
    </TableRow>
  );
}
