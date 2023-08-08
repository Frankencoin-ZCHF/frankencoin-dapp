import Head from "next/head";
import AppPageHeader from "../../../../components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "../../../../components/AppBox";
import SwapFieldInput from "../../../../components/SwapFieldInput";
import { useState } from "react";
import { useChallengeListStats, useChallengeLists, usePositionStats } from "../../../../hooks";
import { formatUnits, getAddress, parseUnits, zeroAddress } from "viem";
import DisplayAmount from "../../../../components/DisplayAmount";
import { formatDate, formatDuration, isDateExpired, shortenAddress } from "../../../../utils";
import Link from "next/link";
import { useContractUrl } from "../../../../hooks/useContractUrl";
import Button from "../../../../components/Button";
import { erc20ABI, useChainId, useContractWrite } from "wagmi";
import { ABIS, ADDRESS } from "../../../../contracts";

export default function ChallengePlaceBid({ }) {
  const [amount, setAmount] = useState(0n)
  const [error, setError] = useState(false);
  const router = useRouter()
  const { address, index } = router.query;
  const position = getAddress(String(address || zeroAddress))
  const challengeIndex = parseInt(String(index) || '0');

  const chainId = useChainId()

  const challenges = useChallengeLists(position)
  const challengeStats = useChallengeListStats(challenges)
  const positionStats = usePositionStats(position);
  const matchingChallenges = challengeStats.filter(challenge => Number(challenge.index) == challengeIndex);
  const challenge = matchingChallenges.length > 0 ? matchingChallenges[0] : undefined;
  const challengerUrl = useContractUrl(challenge?.challenger || zeroAddress)
  const bidderUrl = useContractUrl(challenge?.bidder || zeroAddress)

  const isExpired = isDateExpired(challenge?.end || 0n)
  const bidRatio = challenge ? (amount * BigInt(1e18)) / challenge.size : 0n;
  const buyNowPrice = positionStats.liqPrice * (challenge?.size || 0n);

  const onChangeAmount = (value: string) => {
    const valueBigInt = parseUnits(value, 18);
    setAmount(valueBigInt);
    setError(valueBigInt > positionStats.frankenBalance)
  }

  const { isLoading: approveLoading, write: approveFranken } = useContractWrite({
    address: ADDRESS[chainId].xchf,
    abi: erc20ABI,
    functionName: 'approve',
  })

  const { isLoading: bidLoading, write: placeBid } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: 'bid',
  })

  return (
    <>
      <Head>FrankenCoin - Place Bid</Head>
      <div>
        <AppPageHeader
          title="Place your bid"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <AppBox>
            <div className="space-y-12">
              <div className="space-y-4">
                <SwapFieldInput
                  label="Your Bid"
                  max={positionStats.frankenBalance}
                  value={formatUnits(amount, 18)}
                  onChange={onChangeAmount}
                  symbol={"ZCHF"}
                />
                <div className="flex flex-col gap-1">
                  <span>
                    1 {positionStats.collateralSymbol} = {formatUnits(bidRatio, 18)} ZCHF
                  </span>
                  <span className="text-sm">
                    If there is a higher bid your ZCHF go back to your wallet.
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex">
                  <div className="flex-1">
                    <span className="font-bold">Auctionned Collateral</span>
                  </div>
                  <div className="font-bold">
                    <DisplayAmount
                      amount={challenge?.size || 0n}
                      currency={positionStats.collateralSymbol}
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-1">Buy now price</div>
                  <DisplayAmount
                    amount={buyNowPrice}
                    digits={positionStats.collateralDecimal + 18}
                    currency={"ZCHF"}
                  />
                </div>
                <div className="flex">
                  <div className="flex-1">Highest bid</div>
                  <DisplayAmount
                    amount={challenge?.bid || 0n}
                    currency={"ZCHF"}
                  />
                </div>
                {challenge && challenge.bid > 0n &&
                  <div className="flex">
                    <div className="flex-1">Current Bidder</div>
                    <Link className="text-link" href={bidderUrl} target="_blank" rel="noreferrer">
                      {shortenAddress(challenge?.bidder || zeroAddress)}
                    </Link>
                  </div>
                }
                <div className="flex">
                  <div className="flex-1">Time remaining</div>
                  {isDateExpired(challenge?.end || 0n) ? 'Expired' : 'Active'} ({formatDate(challenge?.end || 0)})
                </div>
                <div className="flex">
                  <div className="flex-1">Auction duration</div>
                  <div>{formatDuration(positionStats.challengePeriod)}</div>
                </div>
                <div className="flex">
                  <div className="flex-1">Challenger</div>
                  <Link className="text-link" href={challengerUrl} target="_blank" rel="noreferrer">
                    {shortenAddress(challenge?.challenger || zeroAddress)}
                  </Link>
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.frankenAllowance ?
                <Button
                  variant="secondary"
                  isLoading={approveLoading}
                  onClick={() => approveFranken({ args: [ADDRESS[chainId].mintingHub, amount] })}
                >Approve</Button>
                :
                <Button
                  variant="primary"
                  disabled={isExpired || amount == 0n}
                  isLoading={bidLoading}
                  onClick={() => placeBid({
                    args: [
                      challenge?.index || 0n,
                      amount,
                      challenge?.size || 0n
                    ]
                  })}
                >Place Bid</Button>
              }
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}