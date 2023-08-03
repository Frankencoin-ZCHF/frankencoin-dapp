import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import AppBox from "../components/AppBox";
import SwapFieldInput from "../components/SwapFieldInput";
import { useState } from "react";
import { useSwapStats } from "../hooks";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import Button from "../components/Button";
import { erc20ABI, useChainId, useContractWrite } from "wagmi";
import { ABIS, ADDRESS } from "../contracts";

export default function Swap() {
  const [amount, setAmount] = useState(0n)
  const [error, setError] = useState(false);
  const [direction, setDirection] = useState(true)

  const chainId = useChainId()
  const swapStats = useSwapStats()
  const { isLoading: approveStablecoinLoading, isIdle: approveIdle, write: approveStableCoin } = useContractWrite({
    address: ADDRESS[chainId].xchf,
    abi: erc20ABI,
    functionName: 'approve',
  })
  const { isLoading: mintLoading, write: mintStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: 'mint',
  })
  const { isLoading: burnLoading, write: burnStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: 'burn',
  })


  const fromBalance = direction ? swapStats.xchfUserBal : swapStats.frankenUserBal;
  const toBalance = !direction ? swapStats.xchfUserBal : swapStats.frankenUserBal;
  const fromSymbol = direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const toSymbol = !direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;

  const onChangeDirection = () => {
    setDirection(!direction)
  }

  const onChangeAmount = (value: string) => {
    const valueBigInt = parseUnits(value, 18);
    setAmount(valueBigInt);
    setError(valueBigInt > fromBalance)
  }

  return (
    <>
      <Head>
        FrankenCoin - Swap
      </Head>
      <AppPageHeader title="Swap XCHF and ZCHF" />
      <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
        <AppBox>
          <SwapFieldInput
            max={fromBalance}
            symbol={fromSymbol}
            // limit="swapLimit"
            limitLabel="Swap limit"
            onChange={onChangeAmount}
            value={formatUnits(amount, 18)}
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
                  isLoading={approveStablecoinLoading}
                  onClick={() => approveStableCoin({ args: [ADDRESS[chainId].bridge, amount] })}
                >Approve</Button>
                :
                <Button
                  variant="primary"
                  isLoading={mintLoading}
                  onClick={() => mintStableCoin({ args: [amount] })}
                >Confirm</Button>
              :
              <Button
                variant="primary"
                isLoading={burnLoading}
                onClick={() => burnStableCoin({ args: [amount] })}
              >Confirm</Button>
            }
          </div>
        </AppBox>
      </section>
    </>
  )
}