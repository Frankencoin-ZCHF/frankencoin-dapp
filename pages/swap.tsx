import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import SwapFieldInput from "@components/SwapFieldInput";
import { useRef, useState } from "react";
import { useSwapStats } from "@hooks";
import { Hash, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import {
  erc20ABI,
  useChainId,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { Id, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { formatBigInt, shortenAddress } from "@utils";
import { TxToast } from "@components/TxToast";

export default function Swap() {
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(true);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const toastId = useRef<Id>(0);

  const chainId = useChainId();
  const swapStats = useSwapStats();
  const { isLoading: approveLoading, writeAsync: approveStableCoin } =
    useContractWrite({
      address: ADDRESS[chainId].xchf,
      abi: erc20ABI,
      functionName: "approve",
      onSuccess(data) {
        toastId.current = toast.loading(
          <TxToast
            title="Approving XCHF"
            rows={[
              {
                title: "Amount:",
                value: formatBigInt(amount) + " XCHF",
              },
              {
                title: "Spender: ",
                value: shortenAddress(ADDRESS[chainId].bridge),
              },
              {
                title: "Transaction:",
                hash: data.hash,
              },
            ]}
          />
        );
        setPendingTx(data.hash);
      },
    });
  const { isLoading: mintLoading, write: mintStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: "mint",
    onSuccess(data) {
      toastId.current = toast.loading(
        <TxToast
          title={`Swapping ${fromSymbol} to ${toSymbol}`}
          rows={[
            {
              title: `${fromSymbol} Amount: `,
              value: formatBigInt(amount) + " " + fromSymbol,
            },
            {
              title: `${toSymbol} Amount: `,
              value: formatBigInt(amount) + " " + toSymbol,
            },
            {
              title: "Transaction:",
              hash: data.hash,
            },
          ]}
        />
      );
      setPendingTx(data.hash);
    },
  });
  const { isLoading: burnLoading, write: burnStableCoin } = useContractWrite({
    address: ADDRESS[chainId].bridge,
    abi: ABIS.StablecoinBridgeABI,
    functionName: "burn",
    onSuccess(data) {
      toastId.current = toast.loading(
        <TxToast
          title={`Swapping ${fromSymbol} to ${toSymbol}`}
          rows={[
            {
              title: `${fromSymbol} Amount: `,
              value: formatBigInt(amount) + " " + fromSymbol,
            },
            {
              title: `${toSymbol} Amount: `,
              value: formatBigInt(amount) + " " + toSymbol,
            },
            {
              title: "Transaction:",
              hash: data.hash,
            },
          ]}
        />
      );
      setPendingTx(data.hash);
    },
  });
  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: pendingTx,
    enabled: pendingTx != zeroAddress,
    onSuccess(data) {
      toast.update(toastId.current, {
        type: "success",
        render: (
          <TxToast
            title="Transaction Confirmed!"
            rows={[
              {
                title: "Transaction: ",
                hash: data.transactionHash,
              },
            ]}
          />
        ),
        autoClose: 5000,
        isLoading: false,
      });
      setPendingTx(zeroAddress);
    },
  });

  const fromBalance = direction
    ? swapStats.xchfUserBal
    : swapStats.frankenUserBal;
  const toBalance = !direction
    ? swapStats.xchfUserBal
    : swapStats.frankenUserBal;
  const fromSymbol = direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const toSymbol = !direction ? swapStats.xchfSymbol : swapStats.frankenSymbol;
  const swapLimit = direction
    ? swapStats.bridgeLimit - swapStats.xchfBridgeBal
    : swapStats.xchfBridgeBal;

  const onChangeDirection = () => {
    setDirection(!direction);
  };

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);

    if (valueBigInt > fromBalance) {
      setError(`Not enough ${fromSymbol} in your wallet.`);
    } else if (valueBigInt > swapLimit) {
      setError(`Not enough ${toSymbol} available to swap.`);
    } else {
      setError("");
    }
  };

  return (
    <>
      <Head>
        <title>Frankencoin - Swap</title>
      </Head>
      <div>
        <AppPageHeader title="Swap XCHF and ZCHF" />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <div className="bg-slate-950 rounded-xl p-8">
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
                className={`btn btn-secondary text-slate-800 w-14 h-14 rounded-full transition ${
                  direction && "rotate-180"
                }`}
                onClick={onChangeDirection}
              >
                <FontAwesomeIcon
                  icon={faArrowRightArrowLeft}
                  className="rotate-90 w-6 h-6"
                />
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
              {direction ? (
                amount > swapStats.xchfUserAllowance ? (
                  <Button
                    isLoading={approveLoading || isConfirming}
                    onClick={() =>
                      approveStableCoin({
                        args: [ADDRESS[chainId].bridge, amount],
                      })
                    }
                  >
                    Approve
                  </Button>
                ) : (
                  <Button
                    disabled={amount == 0n || !!error}
                    isLoading={mintLoading || isConfirming}
                    onClick={() => mintStableCoin({ args: [amount] })}
                  >
                    Swap
                  </Button>
                )
              ) : (
                <Button
                  isLoading={burnLoading || isConfirming}
                  disabled={amount == 0n || !!error}
                  onClick={() => burnStableCoin({ args: [amount] })}
                >
                  Swap
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
