import Head from "next/head";
import AppPageHeader from "../../../../components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "../../../../components/AppBox";
import SwapFieldInput from "../../../../components/SwapFieldInput";
import { useRef, useState } from "react";
import {
  useChallengeListStats,
  useChallengeLists,
  usePositionStats,
} from "../../../../hooks";
import { Hash, formatUnits, getAddress, zeroAddress } from "viem";
import DisplayAmount from "../../../../components/DisplayAmount";
import {
  formatBigInt,
  formatDate,
  formatDuration,
  isDateExpired,
  shortenAddress,
  shortenHash,
} from "../../../../utils";
import Link from "next/link";
import { useContractUrl } from "../../../../hooks/useContractUrl";
import Button from "../../../../components/Button";
import {
  erc20ABI,
  useChainId,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "../../../../contracts";
import { Id, toast } from "react-toastify";
import { TxToast } from "../../../../components/TxToast";

export default function ChallengePlaceBid({}) {
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const toastId = useRef<Id>(0);

  const router = useRouter();
  const { address, index } = router.query;
  const position = getAddress(String(address || zeroAddress));
  const challengeIndex = parseInt(String(index) || "0");

  const chainId = useChainId();

  const { challenges } = useChallengeLists({ position });
  const { challengsData } = useChallengeListStats(challenges);
  const positionStats = usePositionStats(position);
  const matchingChallenges = challengsData.filter(
    (challenge) => Number(challenge.index) == challengeIndex
  );
  const challenge =
    matchingChallenges.length > 0 ? matchingChallenges[0] : undefined;
  const challengerUrl = useContractUrl(challenge?.challenger || zeroAddress);

  const isExpired = isDateExpired(challenge?.auctionEnd || 0n);

  const remainingCol = (challenge?.size || 0n) - (challenge?.filledSize || 0n);
  const buyNowPrice = challenge?.price || 0n;
  const expectedCol = (bidAmount?: bigint) => {
    if (!bidAmount) bidAmount = amount;
    return challenge && challenge?.price > 0n
      ? (bidAmount * BigInt(1e18)) / challenge.price
      : (bidAmount * BigInt(10 ** positionStats.collateralDecimal)) /
          BigInt(1e18);
  };

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);

    if (valueBigInt > positionStats.frankenBalance) {
      setError("Not enough ZCHF balance in your wallet.");
    } else if (expectedCol(valueBigInt) > remainingCol) {
      setError(
        "Expected winning collateral should be lower than remaining collateral."
      );
    } else {
      setError("");
    }
  };

  const { isLoading: approveLoading, write: approveFranken } = useContractWrite(
    {
      address: ADDRESS[chainId].xchf,
      abi: erc20ABI,
      functionName: "approve",
      onSuccess(data) {
        toastId.current = toast.loading(
          <TxToast
            title="Approving ZCHF"
            rows={[
              {
                title: "Amount :",
                value: formatBigInt(amount) + " ZCHF",
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
    }
  );

  const { isLoading: bidLoading, write: placeBid } = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: "bid",
    onSuccess(data) {
      toastId.current = toast.loading(
        <TxToast
          title={`Placing a bid`}
          rows={[
            {
              title: `Bid Amount: `,
              value: formatBigInt(amount) + " ZCHF",
            },
            {
              title: `Win Amount: `,
              value:
                formatBigInt(expectedCol(), positionStats.collateralDecimal) +
                " " +
                positionStats.collateralSymbol,
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
      <Head>FrankenCoin - Place Bid</Head>
      <div>
        <AppPageHeader
          title="Place your bid"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <AppBox>
            <div className="space-y-12">
              <div className="space-y-4">
                <SwapFieldInput
                  label="Your Bid"
                  max={positionStats.frankenBalance}
                  value={amount.toString()}
                  onChange={onChangeAmount}
                  symbol={"ZCHF"}
                  error={error}
                />
                <div className="flex flex-col gap-1">
                  <span>
                    {formatUnits(amount, 18)} ZCHF ={" "}
                    {formatUnits(expectedCol(), 18)}{" "}
                    {positionStats.collateralSymbol}
                  </span>
                  <span className="text-sm">
                    Expected collateral amount to win
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex">
                  <div className="flex-1">
                    <span className="font-bold">Remaining Collateral</span>
                  </div>
                  <div className="font-bold">
                    <DisplayAmount
                      amount={remainingCol}
                      currency={positionStats.collateralSymbol}
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-1">Auctionned Collateral</div>
                  <div>
                    <DisplayAmount
                      amount={challenge?.size || 0n}
                      currency={positionStats.collateralSymbol}
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-1">Buy now price</div>
                  <DisplayAmount
                    amount={buyNowPrice}
                    digits={positionStats.collateralDecimal}
                    currency={"ZCHF"}
                  />
                </div>
                <div className="flex">
                  <div className="flex-1">Time remaining</div>
                  {isExpired ? "Expired" : "Active"} (
                  {formatDate(challenge?.auctionEnd || 0)})
                </div>
                <div className="flex">
                  <div className="flex-1">Auction duration</div>
                  <div>
                    {formatDuration(positionStats.challengePeriod * 2n)}
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-1">Challenger</div>
                  <Link
                    className="text-link"
                    href={challengerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortenAddress(challenge?.challenger || zeroAddress)}
                  </Link>
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.frankenAllowance ? (
                <Button
                  variant="secondary"
                  isLoading={approveLoading || isConfirming}
                  onClick={() =>
                    approveFranken({
                      args: [ADDRESS[chainId].mintingHub, amount],
                    })
                  }
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={amount == 0n}
                  isLoading={bidLoading || isConfirming}
                  onClick={() =>
                    placeBid({
                      args: [
                        Number(challenge?.index || 0n),
                        expectedCol(),
                        true,
                      ],
                    })
                  }
                >
                  Place Bid
                </Button>
              )}
            </div>
          </AppBox>
        </section>
      </div>
    </>
  );
}
