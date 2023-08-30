import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import AppBox from "../components/AppBox";
import DisplayLabel from "../components/DisplayLabel";
import DisplayAmount from "../components/DisplayAmount";
import { usePoolStats, useContractUrl } from "../hooks";
import Link from "next/link";
import { formatDuration, shortenAddress } from "../utils";
import {
  erc20ABI,
  useAccount,
  useChainId,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "../contracts";
import SwapFieldInput from "../components/SwapFieldInput";
import { useState } from "react";
import { Hash, formatUnits, parseUnits, zeroAddress } from "viem";
import Button from "../components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function Pool({}) {
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(true);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);

  const { address } = useAccount();
  const chainId = useChainId();
  const poolStats = usePoolStats();
  const equityUrl = useContractUrl(ADDRESS[chainId].equity);
  const account = address || zeroAddress;

  const { isLoading: approveFrankenLoading, writeAsync: approveFranken } =
    useContractWrite({
      address: ADDRESS[chainId].frankenCoin,
      abi: erc20ABI,
      functionName: "approve",
      onSuccess(data) {
        setPendingTx(data.hash);
      },
    });
  const { isLoading: investLoading, write: invest } = useContractWrite({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "invest",
    onSuccess(data) {
      setPendingTx(data.hash);
    },
  });
  const { isLoading: redeemLoading, write: redeem } = useContractWrite({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "redeem",
    onSuccess(data) {
      setPendingTx(data.hash);
    },
  });
  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: pendingTx,
    enabled: pendingTx != zeroAddress,
    onSuccess(data) {
      setPendingTx(zeroAddress);
    },
  });

  const { data: fpsResult, isLoading: shareLoading } = useContractRead({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "calculateShares",
    args: [amount],
    enabled: direction,
  });

  const { data: frankenResult, isLoading: proceedLoading } = useContractRead({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "calculateProceeds",
    args: [amount],
    enabled: !direction,
  });

  const votingPower =
    poolStats.equityTotalVotes == 0n
      ? 0n
      : (poolStats.equityUserVotes * 10_000n) / poolStats.equityTotalVotes;
  const fromBalance = direction
    ? poolStats.frankenBalance
    : poolStats.equityBalance;
  const result = (direction ? fpsResult : frankenResult) || 0n;
  const fromSymbol = direction ? "ZCHF" : "FPS";
  const toSymbol = !direction ? "ZCHF" : "FPS";
  const redeemLeft =
    86400n * 90n -
    (poolStats.equityBalance
      ? poolStats.equityUserVotes / poolStats.equityBalance / 2n ** 20n
      : 0n);

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);
    if (valueBigInt > fromBalance) {
      setError(`Not enough ${fromSymbol} in your wallet.`);
    } else {
      setError("");
    }
  };

  const conversionNote = () => {
    if (amount != 0n && result != 0n) {
      const ratio = direction
        ? (amount * BigInt(1e18)) / result
        : (result * BigInt(1e18)) / amount;
      return `1 ${toSymbol} = ${formatUnits(ratio, 18)} ${fromSymbol}`;
    } else {
      return `${toSymbol} price is calculated dynamically.\n`;
    }
  };

  return (
    <>
      <Head>FrankenCoin - Pool Shares</Head>
      <div>
        <AppPageHeader title="FrankenCoin Pool Shares (FPS)" />
        <section className="container mx-auto">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
              <AppBox>
                <DisplayLabel label="Supply">
                  <DisplayAmount
                    amount={poolStats.equitySupply}
                    currency="FPS"
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Price">
                  <DisplayAmount
                    amount={poolStats.equityPrice}
                    currency="ZCHF"
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Market Cap">
                  <DisplayAmount
                    amount={
                      (poolStats.equitySupply * poolStats.equityPrice) /
                      BigInt(1e18)
                    }
                    currency="ZCHF"
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Reserve">
                  <DisplayAmount
                    amount={poolStats.frankenTotalReserve}
                    currency="ZCHF"
                  />
                </DisplayLabel>
              </AppBox>
            </div>
            <div className="m-2">
              Contract&nbsp;
              <Link
                href={equityUrl}
                target="_blank"
                rel="noreferrer"
                className="text-link text-red-500"
              >
                {shortenAddress(ADDRESS[chainId].equity)}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-1 lg:grid-cols-2">
              <AppBox>
                <div className="m-auto max-w-lg pb-8">
                  <h6 className="mb-8 text-center">Buy or redeem</h6>
                  <SwapFieldInput
                    max={fromBalance}
                    symbol={fromSymbol}
                    onChange={onChangeAmount}
                    value={amount.toString()}
                    error={error}
                  />

                  <div className="py-4 text-center">
                    <button
                      className={`btn btn-secondary text-slate-800 w-14 h-14 rounded-full transition ${
                        direction && "rotate-180"
                      }`}
                      onClick={() => setDirection(!direction)}
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
                    hideMaxLabel
                    output={formatUnits(
                      (direction ? fpsResult : frankenResult) || 0n,
                      18
                    )}
                    label="Receive"
                  />
                  <div
                    className={`mt-2 px-1 transition-opacity ${
                      (shareLoading || proceedLoading) && "opacity-50"
                    }`}
                  >
                    {conversionNote()}
                    <br />
                    {!direction &&
                      "Redemption requires a 90 days holding period."}
                  </div>

                  <div className="mx-auto mt-8 w-72 max-w-full flex-col">
                    {direction ? (
                      amount > poolStats.frankenAllowance ? (
                        <Button
                          variant="secondary"
                          isLoading={approveFrankenLoading || isConfirming}
                          disabled={amount == 0n || !!error}
                          onClick={() =>
                            approveFranken({
                              args: [ADDRESS[chainId].equity, amount],
                            })
                          }
                        >
                          Approve
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          disabled={amount == 0n || !!error}
                          isLoading={investLoading || isConfirming}
                          onClick={() => invest({ args: [amount, result] })}
                        >
                          Invest
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="primary"
                        isLoading={redeemLoading || isConfirming}
                        disabled={
                          amount == 0n || !!error || !poolStats.equityCanRedeem
                        }
                        onClick={() => redeem({ args: [account, amount] })}
                      >
                        Redeem
                      </Button>
                    )}
                  </div>
                </div>
              </AppBox>
              <div className="flex flex-col gap-1">
                <AppBox>
                  <DisplayLabel label="Your shares">
                    <DisplayAmount
                      amount={poolStats.equityBalance}
                      currency="FPS"
                    />
                  </DisplayLabel>
                </AppBox>
                <AppBox>
                  <DisplayLabel label="Your shares value">
                    <DisplayAmount
                      amount={
                        (poolStats.equityPrice * poolStats.equityBalance) /
                        BigInt(1e18)
                      }
                      currency="ZCHF"
                    />
                  </DisplayLabel>
                </AppBox>
                <AppBox className="flex-1">
                  <DisplayLabel label="Voting Power">
                    <DisplayAmount
                      amount={votingPower}
                      currency="%"
                      digits={2}
                    />
                  </DisplayLabel>
                  <p>
                    A minimum of 3% of the total supply is required to obtain
                    voting power.
                  </p>
                </AppBox>
                <AppBox className="flex-1">
                  <DisplayLabel label="Can redeem after">
                    {formatDuration(redeemLeft)}
                  </DisplayLabel>
                </AppBox>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
