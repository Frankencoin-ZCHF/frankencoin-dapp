import { Address } from "viem";
import DisplayAmount from "../DisplayAmount";
import Link from "next/link";
import { shortenAddress } from "../../utils";
import { useContractUrl } from "../../hooks/useContractUrl";
import dayjs from "dayjs";
import Button from "../Button";
import { useChainId, useContractWrite } from "wagmi";
import { ABIS, ADDRESS } from "../../contracts";

interface Props {
  position: Address
  positionPrice: bigint
  challenger: Address
  challengeSize: bigint
  collateralSymbol: string
  collateralDecimal: number
  bid: bigint
  end: bigint
  index: bigint
}

export default function ChallengeRow({
  position,
  positionPrice,
  challenger,
  challengeSize,
  collateralSymbol,
  collateralDecimal,
  bid,
  end,
  index,
}: Props) {
  const ratio = bid / challengeSize;
  const buyNowPrice = positionPrice * challengeSize
  const ownerUrl = useContractUrl(challenger)
  const endDate = dayjs(Number(end) * 1000)
  const isExpired = endDate.isBefore()

  const chainId = useChainId()
  const { isLoading: endLoading, write: endChallenge } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: 'end'
  })

  return (
    <div className="rounded-lg bg-white p-8 xl:px-16">
      <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
        <div className="grid flex-grow grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <div className="text-gray-400 md:hidden">Auctionated Collateral</div>
            <DisplayAmount
              amount={challengeSize}
              currency={collateralSymbol}
              digits={collateralDecimal}
            />
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Highest Bid</div>
            <DisplayAmount
              amount={challengeSize}
              currency={"ZCHF"}
            />
            {ratio > 0n &&
              <div className="text-sm">
                1 ZCHF =
                <DisplayAmount
                  amount={ratio}
                  currency={"ZCHF"}
                />
              </div>
            }
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Buy now Price</div>
            <DisplayAmount
              amount={buyNowPrice}
              digits={collateralDecimal + 18}
              currency={"ZCHF"}
            />
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Owner</div>
            <Link href={ownerUrl} target="_blank" rel="noreferrer" className="text-link">
              {shortenAddress(challenger)}
            </Link>
          </div>
          <div>
            <div className="text-gray-400 md:hidden">State</div>
            <div className="flex gap-x-2 leading-none">
              <div
                className={`h-4 w-4 flex-shrink-0 rounded-full ${isExpired ? 'bg-gray-300' : 'bg-green-300'}`}
              ></div>
              <div className="flex flex-col gap-y-1">
                <span className="font-bold">{isExpired ? 'Expired' : 'Active'}</span>
                <span className="text-sm">
                  {!isExpired && 'Expires '}
                  {endDate.format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 space-y-2 md:w-40">
          {isExpired ?
            <Button
              size="sm"
              isLoading={endLoading}
              onClick={() => endChallenge({ args: [index] })}
            >Close</Button>
            :
            <Link
              className="btn btn-primary btn-small w-full"
              href={`/position/${position}/bid`}
            >Bid</Link>
          }
        </div>
      </div>
    </div>
  )
}