import Head from "next/head";
import AppPageHeader from "../../../components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "../../../components/AppBox";
import SwapFieldInput from "../../../components/SwapFieldInput";
import { usePositionStats } from "../../../hooks";
import { Hash, getAddress, zeroAddress } from "viem";
import { useRef, useState } from "react";
import DisplayAmount from "../../../components/DisplayAmount";
import {
  formatBigInt,
  formatDuration,
  shortenAddress,
  shortenHash,
} from "../../../utils";
import Button from "../../../components/Button";
import {
  erc20ABI,
  useAccount,
  useChainId,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "../../../contracts";
import { Id, toast } from "react-toastify";
import { TxToast } from "../../../components/TxToast";

export default function PositionChallenge() {
  const router = useRouter();
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
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
      setError(
        "Challenge collateral should not be larger than position collateral"
      );
    } else {
      setError("");
    }
  };

  const { isLoading: approveLoading, write: approveCollateral } =
    useContractWrite({
      address: positionStats.collateral,
      abi: erc20ABI,
      functionName: "approve",
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
  const { isLoading: challengeLoading, write: launchChallenge } =
    useContractWrite({
      address: ADDRESS[chainId].mintingHub,
      abi: ABIS.MintingHubABI,
      functionName: "launchChallenge",
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
      <Head>FrankenCoin - Position Challenge</Head>
      <div>
        <AppPageHeader
          title="Launch a challenge"
          backText="Back to position"
          backTo={`/position/${position}`}
        />
        <section className="container m-auto max-w-2xl">
          <AppBox>
            <SwapFieldInput
              symbol={positionStats.collateralSymbol}
              max={positionStats.collateralUserBal}
              value={amount.toString()}
              onChange={onChangeAmount}
              error={error}
              label="Amount"
            />
            <div className="my-8 flex flex-col gap-2">
              <div className="flex">
                <div className="flex-1">Buy now price</div>
                <DisplayAmount
                  amount={positionStats.liqPrice}
                  currency={"ZCHF"}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Collateral in position</div>
                <DisplayAmount
                  amount={positionStats.collateralBal}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Maximum Bid</div>
                <DisplayAmount
                  amount={positionStats.liqPrice * amount}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal + 18}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Auction duration</div>
                <div>{formatDuration(positionStats.challengePeriod)}</div>
              </div>

              <div className="mt-4 text-sm">
                <p>
                  The amount you provide will be publicly auctioned. There are
                  two possible outcomes:
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
                    with the proceeds being used for repayment. You get a
                    reward.
                  </li>
                </ol>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.collateralAllowance ? (
                <Button
                  variant="secondary"
                  isLoading={approveLoading || isConfirming}
                  disabled={!!error || account == positionStats.owner}
                  onClick={() =>
                    approveCollateral({
                      args: [ADDRESS[chainId].mintingHub, amount],
                    })
                  }
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="primary"
                  isLoading={challengeLoading || isConfirming}
                  disabled={!!error || account == positionStats.owner}
                  onClick={() =>
                    launchChallenge({
                      args: [position, amount, positionStats.liqPrice],
                    })
                  }
                >
                  Challenge
                </Button>
              )}
            </div>
          </AppBox>
        </section>
      </div>
    </>
  );
}
