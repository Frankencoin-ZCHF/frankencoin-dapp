import { Address, zeroAddress } from "viem";
import DisplayAmount from "../DisplayAmount";
import {
  PositionQuery,
  usePositionStats,
  useTokenPrice,
  useZchfPrice,
} from "@hooks";
import { formatDate, formatDateLocale } from "@utils";
import TableRow from "../Table/TableRow";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS } from "../../contracts/address";
import Link from "next/link";

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
  const zchfPrice = useZchfPrice();

  const account = address || zeroAddress;
  const isMine = positionStats.owner == account;

  return (
    <TableRow
      link={`/position/${position.position}`}
      actionCol={
        isMine ? (
          <Link
            href={`/position/${position.position}/adjust`}
            className="btn btn-primary flex-1"
          >
            Adjust
          </Link>
        ) : positionStats.limitForClones > 0n ? (
          <Link
            href={`/position/${position.position}/borrow`}
            className="btn btn-primary flex-1"
          >
            Borrow
          </Link>
        ) : (
          <></>
        )
      }
    >
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
          bold={positionStats.cooldown * 1000n > Date.now()}
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
    </TableRow>
  );
}
