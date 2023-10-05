import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import AppPageHeader from "@components/AppPageHeader";
import Button from "@components/Button";
import DisplayAmount from "@components/DisplayAmount";
import SwapFieldInput from "@components/SwapFieldInput";
import { usePositionStats } from "@hooks";
import { Hash, getAddress, zeroAddress } from "viem";
import { useRef, useState } from "react";
import {
  formatBigInt,
  formatDuration,
  shortenAddress,
  shortenHash,
} from "@utils";
import {
  erc20ABI,
  useAccount,
  useChainId,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { Id, toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";

export default function PositionChallenge() {
  const router = useRouter();
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const toastId = useRef<Id>(0);
  const { address: positionAddr } = router.query;

  const chainId = useChainId();
  const { address } = useAccount();
  const account = address || zeroAddress;
  const position = getAddress(String(positionAddr || zeroAddress));
  const positionStats = usePositionStats(position);

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);
    if (valueBigInt > positionStats.collateralUserBal) {
      setError(`Not enough ${positionStats.collateralSymbol} in your wallet.`);
    } else if (valueBigInt > positionStats.collateralBal) {
      setError("Challenge collateral should be lower than position collateral");
    } else if (valueBigInt < positionStats.minimumCollateral) {
      setError(
        "Challenge collateral should be greater than minimum collateral"
      );
    } else {
      setError("");
    }
  };

  const { isLoading: approveLoading, write: approve } = useContractWrite({
    address: positionStats.collateral,
    abi: erc20ABI,
    functionName: "approve",
    args: [ADDRESS[chainId].mintingHub, amount],
    onSuccess(data) {
      toastId.current = toast.loading(
        <TxToast
          title={"Approving " + positionStats.collateralSymbol}
          rows={[
            {
              title: "Amount :",
              value:
                formatBigInt(amount, positionStats.collateralDecimal) +
                " " +
                positionStats.collateralSymbol,
            },
            {
              title: "Spender: ",
              value: shortenAddress(ADDRESS[chainId].mintingHub),
            },
            {
              title: "Tx: ",
              value: shortenHash(data.hash),
            },
          ]}
        />
      );
      setPendingTx(data.hash);
    },
  });
  const { isLoading: challengeLoading, write: challenge } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: "challenge",
    onSuccess(data) {
      <TxToast
        title={"Launching a challenge"}
        rows={[
          {
            title: "Size :",
            value:
              formatBigInt(amount, positionStats.collateralDecimal) +
              " " +
              positionStats.collateralSymbol,
          },
          {
            title: "Price: ",
            value: formatBigInt(positionStats.liqPrice),
          },
          {
            title: "Tx: ",
            value: shortenHash(data.hash),
          },
        ]}
      />;
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
                title: "Tx hash: ",
                value: shortenHash(pendingTx),
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

  return (
    <>
      <Head>
        <title>FrankenCoin - Position Challenge</title>
      </Head>
      <div>
        <AppPageHeader
          title="Launch Challenge"
          backText="Back to position"
          backTo={`/position/${position}`}
        />
        <section className="grid grid-cols-2 gap-x-4">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center mt-3">
              Challenge Details
            </div>
            <SwapFieldInput
              symbol={positionStats.collateralSymbol}
              max={positionStats.collateralUserBal}
              value={amount.toString()}
              onChange={onChangeAmount}
              error={error}
              label="Amount"
            />
            <div className="bg-slate-900 rounded-xl p-2 grid grid-cols-6 gap-1 lg:col-span-2">
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Starting Price" />
                <DisplayAmount
                  amount={positionStats.liqPrice}
                  currency={"ZCHF"}
                />
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Maximum Bid" />
                <DisplayAmount
                  amount={positionStats.liqPrice * amount}
                  currency={"ZCHF"}
                  digits={positionStats.collateralDecimal + 18}
                />
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Collateral in position" />
                <DisplayAmount
                  amount={positionStats.collateralBal}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal}
                />
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Required Minimum Collateral" />
                <DisplayAmount
                  amount={positionStats.minimumCollateral}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal}
                />
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Fixed Sale period" />
                {formatDuration(positionStats.challengePeriod)}
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Dutch Auction period" />
                {formatDuration(positionStats.challengePeriod)}
              </AppBox>
            </div>
            <div>
              {amount > positionStats.collateralAllowance ? (
                <Button
                  variant="secondary"
                  isLoading={approveLoading || isConfirming}
                  disabled={!!error || account == positionStats.owner}
                  onClick={() => approve()}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="primary"
                  isLoading={challengeLoading || isConfirming}
                  disabled={!!error || account == positionStats.owner}
                  onClick={() =>
                    challenge({
                      args: [position, amount, positionStats.liqPrice],
                    })
                  }
                >
                  Challenge
                </Button>
              )}
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col">
            <div className="text-lg font-bold text-center mt-3">
              How does it work?
            </div>
            <AppBox className="flex-1 mt-4">
              <p>
                The amount you provide will be publicly auctioned. There are two
                possible outcomes:
              </p>
              <ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
                <li>
                  Someone bids the &apos;buy now&apos; price before the end of
                  the auction. In that case, the bidder buys the amount of{" "}
                  {positionStats.collateralSymbol} tokens you provided for{" "}
                  {formatBigInt(positionStats.liqPrice)} ZCHF per unit.
                </li>
                <li>
                  The auction ends with the highest bids being below the
                  &apos;buy now&apos; price. In that case, you get your{" "}
                  {positionStats.collateralSymbol} tokens back and the bidder
                  gets to buy the same amount of{" "}
                  {positionStats.collateralSymbol} tokens out of the position,
                  with the proceeds being used for repayment. You get a reward.
                </li>
              </ol>
            </AppBox>
          </div>
        </section>
      </div>
    </>
  );
}
