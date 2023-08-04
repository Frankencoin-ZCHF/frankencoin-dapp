import Head from "next/head";
import AppPageHeader from "../../../components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "../../../components/AppBox";
import SwapFieldInput from "../../../components/SwapFieldInput";
import { usePositionStats } from "../../../hooks";
import { formatUnits, getAddress, parseUnits, zeroAddress } from "viem";
import { useState } from "react";
import DisplayAmount from "../../../components/DisplayAmount";
import { formatDuration, formatNumber } from "../../../utils";
import Button from "../../../components/Button";
import { erc20ABI, useChainId, useContractWrite } from "wagmi";
import { ABIS, ADDRESS } from "../../../contracts";

export default function PositionChallenge() {
  const router = useRouter()
  const [amount, setAmount] = useState(0n)
  const [error, setError] = useState(false);
  const { address } = router.query;

  const chainId = useChainId()
  const position = getAddress(String(address || zeroAddress))
  const positionStats = usePositionStats(position)
  console.log(positionStats.collateralAllowance)

  const onChangeAmount = (value: string) => {
    const valueBigInt = parseUnits(value, positionStats.collateralDecimal);
    setAmount(valueBigInt);
    setError(valueBigInt > positionStats.collateralUserBal)
  }

  const { isLoading: approveLoading, write: approveCollateral } = useContractWrite({
    address: positionStats.collateral,
    abi: erc20ABI,
    functionName: 'approve',
  })
  const { isLoading: challengeLoading, write: launchChallenge } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: 'launchChallenge',
  })
  // TODO: Check self challenge

  return (
    <>
      <Head>FrankenCoin - Position Challenge</Head>
      <div>
        <AppPageHeader
          title="Launch a challenge"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="container m-auto max-w-2xl">
          <AppBox>
            <SwapFieldInput
              symbol={positionStats.collateralSymbol}
              max={positionStats.collateralUserBal}
              value={formatUnits(amount, positionStats.collateralDecimal)}
              onChange={onChangeAmount}
              error={error}
              label="Amount"
            />
            <div className="my-8 flex flex-col gap-2">
              <div className="flex">
                <div className="flex-1">Buy now price</div>
                <DisplayAmount
                  amount={positionStats.liqPrice}
                  currency={"ZCHF"}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Collateral in position</div>
                <DisplayAmount
                  amount={positionStats.collateralBal}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Maximum Bid</div>
                <DisplayAmount
                  amount={positionStats.liqPrice * amount}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal + 18}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Auction duration</div>
                <div>{formatDuration(positionStats.challengePeriod)}</div>
              </div>

              <div className="mt-4 text-sm">
                <p>
                  The amount you provide will be publicly auctioned. There are two
                  possible outcomes:
                </p>
                <ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
                  <li>
                    Someone bids the &apos;buy now&apos; price before the end of the auction.
                    In that case, the bidder buys the amount of&nbsp;
                    {positionStats.collateralSymbol} tokens you provided for&nbsp;
                    {formatNumber(positionStats.liqPrice)} ZCHF per unit.
                  </li>
                  <li>
                    The auction ends with the highest bids being below the &apos;buy now&apos;
                    price. In that case, you get your&nbsp;
                    {positionStats.collateralSymbol} tokens back and the bidder gets
                    to buy the same amount of&nbsp;
                    {positionStats.collateralSymbol} tokens out of the position,
                    with the proceeds being used for repayment. You get a reward.
                  </li>
                </ol>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.collateralAllowance ?
                <Button
                  variant="secondary"
                  isLoading={approveLoading}
                  onClick={() => approveCollateral({ args: [ADDRESS[chainId].mintingHub, amount] })}
                >Approve</Button>
                :
                <Button
                  variant="primary"
                  isLoading={challengeLoading}
                  onClick={() => launchChallenge({ args: [position, amount, positionStats.liqPrice] })}
                >Challenge</Button>
              }
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}