import { Address, zeroAddress } from "viem";
import DisplayAmount from "../DisplayAmount";
import { usePositionStats } from "@hooks";
import { formatDate, formatDateLocale } from "@utils";
import TableRow from "../Table/TableRow";
import { useAccount } from "wagmi";

interface Props {
  position: Address;
  collateral: Address;
}

export default function PositionRow({ position, collateral }: Props) {
  const { address } = useAccount();
  const positionStats = usePositionStats(position, collateral);
  const account = address || zeroAddress;
  const isMine = positionStats.owner == account;
  const calendarLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${
    isMine
      ? "Repay+Expiring+Frankencoin+Position!"
      : "Frankencoin+Position+Expiration!"
  }&dates=${
    isMine
      ? formatDateLocale(positionStats.expiration - BigInt(60 * 60 * 24 * 3))
      : formatDateLocale(positionStats.expiration)
  }/${
    isMine
      ? formatDateLocale(
          positionStats.expiration - BigInt(60 * 60 * 24 * 3) + 1800n
        )
      : formatDateLocale(positionStats.expiration + 1800n)
  }&details=For+details,+go+here:%0Ahttps://frankencoin.com/position/${position}`;

  const openCalendar = (e: any) => {
    e.preventDefault();
    window.open(calendarLink, "_blank");
  };

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
        <DisplayAmount
          amount={positionStats.liqPrice}
          currency={"ZCHF"}
          digits={36 - positionStats.collateralDecimal}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Available Amount</div>
        <DisplayAmount
          amount={positionStats.limitForClones}
          currency={"ZCHF"}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Expiration Date</div>
        <div className="underline" onClick={openCalendar}>
          {formatDate(positionStats.expiration)}
        </div>
      </div>
    </TableRow>
  );
}
