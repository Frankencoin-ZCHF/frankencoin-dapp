import { Address, zeroAddress } from "viem";
import DisplayAmount from "../DisplayAmount";
import { PositionQuery, usePositionStats, useTokenPrice } from "@hooks";
import { formatDate, formatDateLocale } from "@utils";
import TableRow from "../Table/TableRow";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS } from "../../contracts/address";
import ProgressBar from "@components/ProgressBar";

interface Props {
  position: PositionQuery;
}

export default function PositionRow({ position }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const positionStats = usePositionStats(
    position.position,
    position.collateral
  );
  const collTokenPrice = useTokenPrice(position.collateral);
  const zchfPrice = useTokenPrice(ADDRESS[chainId].frankenCoin);
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
  }&details=For+details,+go+here:%0Ahttps://frankencoin.com/position/${
    position.position
  }`;
  console.log(positionStats.expiration);

  return (
    <TableRow link={`/position/${position.position}`}>
      <div>
        <DisplayAmount
          amount={positionStats.collateralBal}
          currency={positionStats.collateralSymbol}
          digits={positionStats.collateralDecimal}
          address={positionStats.collateral}
          usdPrice={collTokenPrice}
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
          usdPrice={zchfPrice}
        />
      </div>
      <div>
        <DisplayAmount
          amount={positionStats.limitForClones}
          currency={"ZCHF"}
          hideLogo
          address={ADDRESS[chainId].frankenCoin}
          usdPrice={zchfPrice}
        />
      </div>
      <div>
        {positionStats.closed ? (
          "Closed"
        ) : (
          <ProgressBar
            label={formatDate(positionStats.expiration)}
            link={calendarLink}
            progress={
              ((Date.now() / 1000 - position.created) /
                (Number(positionStats.expiration) - position.created)) *
              100
            }
          />
        )}
      </div>
    </TableRow>
  );
}
