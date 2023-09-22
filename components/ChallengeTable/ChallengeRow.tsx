import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import Link from "next/link";
import {
  formatDate,
  isDateExpired,
  isDateUpcoming,
  shortenAddress,
} from "../../utils";
import { useContractUrl } from "../../hooks/useContractUrl";
import { usePositionStats } from "../../hooks";
import TableRow from "../Table/TableRow";

interface Props {
  position: Address;
  challenger: Address;
  challengeSize: bigint;
  end: bigint;
  price: bigint;
  index: bigint;
}

export default function ChallengeRow({
  position,
  challenger,
  challengeSize,
  end,
  price,
  index,
}: Props) {
  const positionStats = usePositionStats(position);
  const buyNowPrice = (price * challengeSize) / BigInt(1e18);
  const ownerUrl = useContractUrl(challenger);
  const endDate = formatDate(end);
  const isExpired = isDateExpired(end);

  return (
    <TableRow
      actionCol={
        <Link
          className="btn btn-primary btn-small w-full"
          href={`/position/${position}/bid/${index}`}
        >
          Bid
        </Link>
      }
    >
      <div>
        <div className="text-gray-400 md:hidden">Auctionated Collateral</div>
        <DisplayAmount
          amount={challengeSize}
          currency={positionStats.collateralSymbol}
          digits={positionStats.collateralDecimal}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Current Price</div>
        <DisplayAmount
          amount={buyNowPrice}
          digits={positionStats.collateralDecimal}
          currency={"ZCHF"}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Owner</div>
        <Link
          href={ownerUrl}
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          {shortenAddress(challenger)}
        </Link>
      </div>
      <div>
        <div className="text-gray-400 md:hidden">State</div>
        <div className="flex gap-x-2 leading-none">
          <div
            className={`h-4 w-4 flex-shrink-0 rounded-full ${
              isExpired ? "bg-gray-300" : "bg-green-300"
            }`}
          ></div>
          <div className="flex flex-col gap-y-1">
            <span className="font-bold">
              {isExpired ? "Expired" : "Active"}
            </span>
            <span className="text-sm">
              {!isExpired && "Expires "}
              {endDate}
            </span>
          </div>
        </div>
      </div>
    </TableRow>
  );
}
