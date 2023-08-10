import Head from "next/head";
import AppPageHeader from "../../../components/AppPageHeader";
import { useRouter } from "next/router";
import { formatUnits, getAddress, parseUnits, zeroAddress, Hash } from "viem";
import AppBox from "../../../components/AppBox";
import SwapFieldInput from "../../../components/SwapFieldInput";
import { usePositionStats } from "../../../hooks";
import { useState } from "react";
import DisplayAmount from "../../../components/DisplayAmount";
import Button from "../../../components/Button";
import { erc20ABI, useChainId, useContractWrite, useWaitForTransaction } from "wagmi";
import { ABIS, ADDRESS } from "../../../contracts";
import { min } from "../../../utils";

export default function PositionBorrow({ }) {
  const router = useRouter()
  const [amount, setAmount] = useState(0n)
  const [error, setError] = useState(false);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const { address } = router.query;

  const chainId = useChainId()
  const position = getAddress(String(address || zeroAddress))
  const positionStats = usePositionStats(position)

  const requiredColl = positionStats.liqPrice == 0n ? 0n : BigInt(1e18) * amount / positionStats.liqPrice
  const borrowersReserveContribution = positionStats.reserveContribution * amount / 1_000_000n;
  const fees = positionStats.mintingFee * amount / 1_000_000n;
  const paidOutToWallet = amount - borrowersReserveContribution - fees;
  const availableAmount = positionStats.limit - positionStats.minted;
  const userValue = positionStats.collateralBal * positionStats.liqPrice / BigInt(1e18);

  const onChangeAmount = (value: string) => {
    const valueBigInt = parseUnits(value, 18);
    setAmount(valueBigInt);
    setError(valueBigInt > positionStats.frankenAllowance)
  }

  const { isLoading: approveLoading, writeAsync: approveFranken } = useContractWrite({
    address: ADDRESS[chainId].frankenCoin,
    abi: erc20ABI,
    functionName: 'approve',
    onSuccess(data) {
      setPendingTx(data.hash)
    }
  })
  const { isLoading: cloneLoading, write: clonePosition } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: 'clonePosition',
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
                error={error}
                max={min(availableAmount, userValue)}
                value={formatUnits(amount, 18)}
                onChange={onChangeAmount}
              />
              <SwapFieldInput
                showOutput
                label="Required Collateral"
                output={formatUnits(requiredColl, positionStats.collateralDecimal)}
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
                <div className="flex">
                  <div className="flex-1">Locked in borrowers reserve</div>
                  <DisplayAmount
                    amount={borrowersReserveContribution}
                    currency="ZCHF"
                  />
                </div>
                <div className="flex">
                  <div className="flex-1">Fees</div>
                  <DisplayAmount
                    amount={fees}
                    currency="ZCHF"
                  />
                </div>
                <hr />
                <div className="flex font-bold">
                  <div className="flex-1">Total</div>
                  <DisplayAmount
                    amount={amount}
                    currency="ZCHF"
                  />
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.frankenAllowance ?
                <Button
                  variant="secondary"
                  disabled={amount == 0n || error}
                  isLoading={approveLoading || isConfirming}
                  onClick={() => approveFranken({ args: [ADDRESS[chainId].mintingHub, amount] })}
                >Approve</Button>
                :
                <Button
                  variant="primary"
                  disabled={amount == 0n || error}
                  isLoading={cloneLoading || isConfirming}
                  onClick={() => clonePosition({ args: [position, requiredColl, amount, positionStats.expiration] })}
                >Clone Position</Button>
              }
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}