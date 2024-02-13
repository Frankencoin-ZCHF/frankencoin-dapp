import { Address, zeroAddress } from "viem";
import DisplayAmount from "../DisplayAmount";
import { usePositionStats } from "@hooks";
import { formatDate, formatDateLocale } from "@utils";
import TableRow from "../Table/TableRow";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS } from "../../contracts/address";

interface Props {
  position: Address;
  collateral: Address;
}

export default function PositionRow({ position, collateral }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
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
        <DisplayAmount
          amount={positionStats.collateralBal}
          currency={positionStats.collateralSymbol}
          digits={positionStats.collateralDecimal}
          address={positionStats.collateral}
        />
      </div>
      <div>
        <DisplayAmount
          amount={positionStats.liqPrice}
          currency={"ZCHF"}
          hideLogo
          bold={positionStats.cooldown * 1000n > new Date().getTime()}
          digits={36 - positionStats.collateralDecimal}
          address={ADDRESS[chainId].frankenCoin}
        />
      </div>
      <div>
        <DisplayAmount
          amount={positionStats.limitForClones}
          currency={"ZCHF"}
          hideLogo
          address={ADDRESS[chainId].frankenCoin}
        />
      </div>
      <div>
        { positionStats.closed ? "Closed" :
        <div className="underline" onClick={openCalendar}>
          {formatDate(positionStats.expiration)}
        </div>
        }
      </div>
    </TableRow>
  );
}
