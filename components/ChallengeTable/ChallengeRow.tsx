import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import Link from "next/link";
import {
  formatDate,
  formatDateDuration,
  formatDuration,
  isDateExpired,
  isDateUpcoming,
  shortenAddress,
} from "@utils";
import { useContractUrl, usePositionStats } from "@hooks";
import TableRow from "../Table/TableRow";

interface Props {
  position: Address;
  challenger: Address;
  challengeSize: bigint;
  filledSize: bigint;
  fixedEnd: bigint;
  auctionEnd: bigint;
  duration: bigint;
  price: bigint;
  index: bigint;
}

export default function ChallengeRow({
  position,
  challenger,
  challengeSize,
  filledSize,
  fixedEnd,
  auctionEnd,
  duration,
  price,
  index,
}: Props) {
  const positionStats = usePositionStats(position);
  const ownerUrl = useContractUrl(challenger);
  const endDate = formatDate(auctionEnd);
  const isFixedEnd = isDateExpired(fixedEnd);
  const isAuctionExpired = isDateExpired(auctionEnd);

  const stateText = !isFixedEnd
    ? "Fixed Price Phase"
    : !isAuctionExpired
    ? "Sliding Price Phase"
    : "Expired";
  const priceText = !isFixedEnd
    ? "Price starts falling in " +
      formatDuration(fixedEnd - BigInt(Math.floor(Date.now() / 1000)))
    : !isAuctionExpired
    ? "Zero is reached in " +
      formatDuration(auctionEnd - BigInt(Math.floor(Date.now() / 1000)))
    : "Auction ended at " + formatDate(auctionEnd);

  return (
    <TableRow link={`/position/${position}/bid/${index}`}>
      <div>
        <div className="text-gray-400 md:hidden">Auction</div>
        <DisplayAmount
          amount={challengeSize}
          currency={positionStats.collateralSymbol}
          digits={positionStats.collateralDecimal}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Remaining</div>
        <DisplayAmount
          amount={challengeSize - filledSize}
          currency={positionStats.collateralSymbol}
          digits={positionStats.collateralDecimal}
        />
      </div>
      <div>
        <div className="text-gray-400 md:hidden">Buy Now Price</div>
        <DisplayAmount
          amount={price}
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
              isAuctionExpired ? "bg-gray-300" : "bg-green-300"
            }`}
          ></div>
          <div className="flex flex-col gap-y-1">
            <span className="font-bold">{stateText}</span>
            <span className="text-sm">{priceText}</span>
          </div>
        </div>
      </div>
    </TableRow>
  );
}
