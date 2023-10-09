import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import Link from "next/link";
import {
  formatBigInt,
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

  const filledRate = challengeSize ? (filledSize * 10000n) / challengeSize : 0n;

  const stateText = !isFixedEnd
    ? "Fixed Price Phase"
    : !isAuctionExpired
    ? "Declining Price Phase"
    : "Zero Price Phase";
  const priceText = !isFixedEnd
    ? "Price starts falling in " +
      formatDuration(fixedEnd - BigInt(Math.floor(Date.now() / 1000)))
    : !isAuctionExpired
    ? "Zero is reached in " +
      formatDuration(auctionEnd - BigInt(Math.floor(Date.now() / 1000)))
    : "Reached zero at " + formatDate(auctionEnd);

  return (
    // <TableRow link={`/position/${position}/bid/${index}`}>
    <Link
      className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-5 rounded-xl duration-300"
      href={`/position/${position}/bid/${index}`}
    >
      <div className="grid grid-cols-3">
        <div>
          <div className="text-sm">Auction Price</div>
          <div className="text-white font-bold">{formatBigInt(price)} ZCHF</div>
        </div>
        <div className="text-center">
          <div className="text-sm">Cap</div>
          <div className="text-white font-bold">
            {formatBigInt(challengeSize, positionStats.collateralDecimal)}{" "}
            {positionStats.collateralSymbol}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm">State</div>
          <div
            className={`font-bold ${
              isAuctionExpired ? "text-gray-300" : "text-green-300"
            }`}
          >
            {stateText}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray text-right">{priceText}</div>
      <div className="flex">
        <span>Progress</span>
      </div>
      <div className="flex bg-gray-500 h-2 rounded-lg">
        <div
          className="bg-rose-400 rounded-lg"
          style={{ width: `${Number(filledRate / 100n)}%` }}
        />
      </div>
      <div className="flex">
        <span>{formatBigInt(filledRate, 2)} %</span>
        <span className="ml-auto">
          {formatBigInt(filledSize, positionStats.collateralDecimal)} /{" "}
          {formatBigInt(challengeSize, positionStats.collateralDecimal)}
        </span>
      </div>
    </Link>
  );
}
