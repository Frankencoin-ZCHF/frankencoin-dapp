import { useRouter } from "next/router";
import { useState } from "react";
import { Hash, formatUnits, getAddress, parseUnits, zeroAddress } from "viem";
import { usePositionStats } from "../../../hooks";
import Head from "next/head";
import AppPageHeader from "../../../components/AppPageHeader";
import AppBox from "../../../components/AppBox";
import SwapFieldInput from "../../../components/SwapFieldInput";
import DisplayAmount from "../../../components/DisplayAmount";
import { abs } from "../../../utils";
import Button from "../../../components/Button";
import { erc20ABI, useChainId, useContractWrite, useWaitForTransaction } from "wagmi";
import { ABIS, ADDRESS } from "../../../contracts";

export default function PositionAdjust({ }) {
  const router = useRouter()
  const [amount, setAmount] = useState(0n)
  const [collateralAmount, setCollateralAmount] = useState(0n)
  const [liqPrice, setLiqPrice] = useState(0n)
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const { address } = router.query;

  const chainId = useChainId();
  const position = getAddress(String(address || zeroAddress))
  const positionStats = usePositionStats(position)

  const additionalAmount = amount - positionStats.minted;
  const isNegativeDiff = additionalAmount < 0;
  const borrowReserveContribution = positionStats.reserveContribution * additionalAmount / 1_000_000n;
  const fees = additionalAmount * positionStats.mintingFee / 1_000_000n;

  const paidOutAmount = () => {
    const reserveAndFees = borrowReserveContribution + fees;

    if (isNegativeDiff) {
      return abs(additionalAmount - fees) - reserveAndFees;
    } else {
      return additionalAmount - reserveAndFees;
    }
  }

  const collateralNote = collateralAmount < positionStats.collateralBal ?
    `${formatUnits(abs(collateralAmount - positionStats.collateralBal), positionStats.collateralDecimal)} ${positionStats.collateralSymbol} sent back to your wallet`
    : collateralAmount > positionStats.collateralBal ?
      `${formatUnits(abs(collateralAmount - positionStats.collateralBal), positionStats.collateralDecimal)} ${positionStats.collateralSymbol} taken from your wallet`
      : '';

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);
    // setError(valueBigInt > fromBalance)
  }

  const onChangeCollAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setCollateralAmount(valueBigInt);
    // setError(valueBigInt > fromBalance)
  }

  const onChangeLiqAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setLiqPrice(valueBigInt);
    // setError(valueBigInt > fromBalance)
  }

  const { isLoading: approveLoading, write: approveCollateral } = useContractWrite({
    address: positionStats.collateral,
    abi: erc20ABI,
    functionName: 'approve',
    onSuccess(data) {
      setPendingTx(data.hash)
    }
  })

  const { isLoading: adjustLoading, write: adjustPos } = useContractWrite({
    address: position,
    abi: ABIS.PositionABI,
    functionName: 'adjust',
    onSuccess(data) {
      setPendingTx(data.hash)
    }
  })

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: pendingTx,
    enabled: pendingTx != zeroAddress,
    onSuccess(data) {
      setPendingTx(zeroAddress);
    }
  })

  return (
    <>
      <Head>FrankenCoin - Adjust Position</Head>
      <div>
        <AppPageHeader
          title="Adjust Your Position"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <AppBox>
            <div className="space-y-12">
              <div className="space-y-4">
                <SwapFieldInput
                  label="Amount"
                  symbol="ZCHF"
                  // TODO: MAX Amount
                  value={amount.toString()}
                  onChange={onChangeAmount}
                // TODO: Children
                />
                <div className="flex flex-col gap-2">
                  <div className="flex">
                    <div className="flex-1">Current Amount</div>
                    <DisplayAmount
                      amount={positionStats.minted}
                      currency={"ZCHF"}
                    />
                  </div>
                  <div className="flex">
                    <div className="flex-1">{isNegativeDiff ? "Taken in wallet" : "Received in wallet"}</div>
                    <DisplayAmount
                      amount={paidOutAmount()}
                      currency={"ZCHF"}
                    />
                  </div>
                  <div className="flex">
                    <div className="flex-1">{isNegativeDiff ? "Taken from reserve" : "Reserve contribution"}</div>
                    <DisplayAmount
                      amount={borrowReserveContribution}
                      currency={"ZCHF"}
                    />
                  </div>
                  {!isNegativeDiff &&
                    <div className="flex font-bold">
                      <div className="flex-1">Fee</div>
                      <DisplayAmount
                        amount={fees}
                        currency={"ZCHF"}
                      />
                    </div>
                  }
                  <hr />
                  <div className="flex font-bold">
                    <div className="flex-1">New Amount</div>
                    <DisplayAmount
                      amount={amount}
                      currency={"ZCHF"}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <SwapFieldInput
                  label="Collateral"
                  symbol={positionStats.collateralSymbol}
                  max={positionStats.collateralUserBal}
                  value={collateralAmount.toString()}
                  onChange={onChangeCollAmount}
                  digit={positionStats.collateralDecimal}
                  note={collateralNote}
                // TODO: Children
                />
              </div>
              <div className="space-y-4">
                <SwapFieldInput
                  label="Liquidation Price"
                  symbol={"ZCHF"}
                  max={positionStats.liqPrice}
                  value={liqPrice.toString()}
                  onChange={onChangeLiqAmount}
                // TODO: Children
                />
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {collateralAmount > positionStats.collateralPosAllowance ?
                <Button
                  variant="secondary"
                  isLoading={approveLoading || isConfirming}
                  onClick={() => approveCollateral({ args: [position, collateralAmount] })}
                >Approve Collateral</Button>
                :
                <Button
                  variant="primary"
                  disabled={amount == 0n}
                  isLoading={adjustLoading}
                  onClick={() => adjustPos({
                    args: [
                      amount,
                      collateralAmount,
                      liqPrice
                    ]
                  })}
                >Adjust Position</Button>
              }
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}