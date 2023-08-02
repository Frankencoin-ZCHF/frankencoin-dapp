import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import AppBox from "../components/AppBox";
import SwapFieldInput from "../components/SwapFieldInput";
import { useState } from "react";
import { useSwapStats } from "../hooks";
import { parseUnits } from "viem";

export default function Swap() {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(false);
  const [direction, setDirection] = useState(true)
  const swapStats = useSwapStats()

  const fromBalance = direction ? swapStats.xchfUserBal : swapStats.frankenUserBal;
  const fromSymbol = direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const toSymbol = !direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;

  const onChangeDirection = () => {
    setDirection(!direction)
  }

  const onChangeAmount = (value: string) => {
    setAmount(value);

    const valueBigInt = parseUnits(value, 18);
    setError(valueBigInt > fromBalance)
    console.log(value, valueBigInt > fromBalance)
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
            value={amount}
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
            hideMaxLabel
            showOutput
            output={amount}
            note={`1 ${fromSymbol} = 1 ${toSymbol}`}
            label="Receive"
          />
        </AppBox>
      </section>
    </>
  )
}