import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import AppBox from "../components/AppBox";
import SwapFieldInput from "../components/SwapFieldInput";
import { useState } from "react";
import { useSwapStats } from "../hooks";
import { Hash, formatUnits, parseUnits, zeroAddress } from "viem";
import Button from "../components/Button";
import { erc20ABI, useChainId, useContractWrite, useWaitForTransaction } from "wagmi";
import { ABIS, ADDRESS } from "../contracts";

export default function Swap() {
  const [amount, setAmount] = useState(0n)
  const [error, setError] = useState(false);
  const [direction, setDirection] = useState(true)
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);

  const chainId = useChainId()
  const swapStats = useSwapStats()
  const { isLoading: approveStablecoinLoading, writeAsync: approveStableCoin } = useContractWrite({
    address: ADDRESS[chainId].xchf,
    abi: erc20ABI,
    functionName: 'approve',
    onSuccess(data) {
      setPendingTx(data.hash)
    }
  })
  const { isLoading: mintLoading, write: mintStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: 'mint',
    onSuccess(data) {
      setPendingTx(data.hash)
    }
  })
  const { isLoading: burnLoading, write: burnStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: 'burn',
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

  const fromBalance = direction ? swapStats.xchfUserBal : swapStats.frankenUserBal;
  const toBalance = !direction ? swapStats.xchfUserBal : swapStats.frankenUserBal;
  const fromSymbol = direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const toSymbol = !direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const swapLimit = direction ? (swapStats.bridgeLimit - swapStats.xchfBridgeBal) : swapStats.xchfBridgeBal;

  const onChangeDirection = () => {
    setDirection(!direction)
  }

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    console.log(value)
    setAmount(valueBigInt);
    setError(valueBigInt > fromBalance || valueBigInt > swapLimit)
  }

  return (
    <>
      <Head>
        FrankenCoin - Swap
      </Head>
      <div>
        <AppPageHeader title="Swap XCHF and ZCHF" />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <AppBox>
            <SwapFieldInput
              max={fromBalance}
              symbol={fromSymbol}
              limit={swapLimit}
              limitLabel="Swap limit"
              onChange={onChangeAmount}
              value={amount.toString()}
              error={error}
            />

            <div className="py-4 text-center">
              <button
                className={`btn btn-secondary w-14 h-14 rounded-full transition ${direction && 'rotate-180'}`}
                onClick={onChangeDirection}
              >
                <picture>
                  <img src="/assets/swap.svg" alt="Swap" />
                </picture>
              </button>
            </div>

            <SwapFieldInput
              symbol={toSymbol}
              showOutput
              max={toBalance}
              output={formatUnits(amount, 18)}
              note={`1 ${fromSymbol} = 1 ${toSymbol}`}
              label="Receive"
            />

            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {direction ?
                amount > swapStats.xchfUserAllowance ?
                  <Button
                    variant="secondary"
                    isLoading={approveStablecoinLoading || isConfirming}
                    onClick={() => approveStableCoin({ args: [ADDRESS[chainId].bridge, amount] })}
                  >Approve</Button>
                  :
                  <Button
                    variant="primary"
                    disabled={amount == 0n || error}
                    isLoading={mintLoading || isConfirming}
                    onClick={() => mintStableCoin({ args: [amount] })}
                  >Swap</Button>
                :
                <Button
                  variant="primary"
                  isLoading={burnLoading || isConfirming}
                  disabled={amount == 0n || error}
                  onClick={() => burnStableCoin({ args: [amount] })}
                >Swap</Button>
              }
            </div>
          </AppBox>
        </section>
      </div>
    </>
  )
}