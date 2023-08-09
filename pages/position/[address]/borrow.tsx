import Head from "next/head";
import AppPageHeader from "../../../components/AppPageHeader";
import { useRouter } from "next/router";
import { formatUnits, getAddress, parseUnits, zeroAddress } from "viem";
import AppBox from "../../../components/AppBox";
import SwapFieldInput from "../../../components/SwapFieldInput";
import { usePositionStats } from "../../../hooks";
import { useState } from "react";
import DisplayAmount from "../../../components/DisplayAmount";

export default function PositionBorrow({ }) {
  const router = useRouter()
  const [amount, setAmount] = useState(0n)
  const { address } = router.query;

  const position = getAddress(String(address || zeroAddress))
  const positionStats = usePositionStats(position)

  const requiredColl = positionStats.liqPrice == 0n ? 0n : BigInt(1e18) * amount / positionStats.liqPrice
  const borrowersReserveContribution = positionStats.reserveContribution * amount / 1_000_000n;
  const fees = positionStats.mintingFee * amount / 1_000_000n;
  const paidOutToWallet = amount - (positionStats.reserveContribution + positionStats.mintingFee) * amount / 1_000_000n;

  const onChangeAmount = (value: string) => {
    const valueBigInt = parseUnits(value, 18);
    setAmount(valueBigInt);
    // setError(valueBigInt > fromBalance)
  }

  return (
    <>
      <Head>FrankenCoin - Borrow</Head>
      <div>
        <AppPageHeader
          title="Borrow ZCHF"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <AppBox>
            <div className="space-y-8">
              <SwapFieldInput
                label="Borrow"
                symbol="ZCHF"
                value={formatUnits(amount, 18)}
                onChange={onChangeAmount}
              />
              <SwapFieldInput
                showOutput
                label="Required Collateral"
                output={formatUnits(requiredColl, 18)}
                symbol={positionStats.collateralSymbol}
                hideMaxLabel
              />
              <div className="flex flex-col gap-2">
                <div className="flex">
                  <div className="flex-1">Paid to your wallet</div>
                  <DisplayAmount
                    amount={paidOutToWallet}
                    currency="ZCHF"
                  />
                </div>
              </div>
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}