import { useRef, useState } from "react";
import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import SwapFieldInput from "@components/SwapFieldInput";
import DisplayAmount from "@components/DisplayAmount";
import {
  useChallengeListStats,
  useChallengeLists,
  usePositionStats,
  useContractUrl,
} from "@hooks";
import { Hash, formatUnits, getAddress, zeroAddress } from "viem";
import {
  formatBigInt,
  formatDate,
  formatDuration,
  isDateExpired,
  shortenAddress,
  shortenHash,
  transactionLink,
} from "@utils";
import Link from "next/link";
import Button from "@components/Button";
import {
  erc20ABI,
  useChainId,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import { Id, toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";

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
                title: "Amount:",
                value: formatBigInt(amount) + " ZCHF",
              },
              {
                title: "Spender: ",
                value: shortenAddress(ADDRESS[chainId].mintingHub),
              },
              {
                title: "Transaction:",
                value: shortenHash(data.hash),
                link:  transactionLink(data.hash),
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
              title: "Transaction:",
              value: shortenHash(data.hash),
              link:  transactionLink(data.hash),
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
                value: shortenHash(pendingTx),
                link:  transactionLink(pendingTx),
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
        <title>Frankencoin - Place Bid</title>
      </Head>
      <div>
        <AppPageHeader
          title="Place your bid"
          backText="Back to position"
          backTo={`/position/${address}`}
        />
        <section className="mx-auto max-w-2xl px-4 sm:px-8">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center mt-3">
              Bid Details
            </div>
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
            </div>
            <div className="bg-slate-900 rounded-xl p-2 grid grid-cols-2 gap-1 lg:col-span-2">
              <AppBox>
                <DisplayLabel label="Remaining Collateral" />
                <DisplayAmount
                  amount={remainingCol}
                  currency={positionStats.collateralSymbol}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Original Size" />
                <DisplayAmount
                  amount={challenge?.size || 0n}
                  currency={positionStats.collateralSymbol}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Price per Unit" />
                <DisplayAmount
                  amount={buyNowPrice}
                  digits={36 - positionStats.collateralDecimal}
                  currency={"ZCHF"}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Reaching Zero at" />
                {formatDate(challenge?.auctionEnd || 0)}
              </AppBox>
              <AppBox>
                <DisplayLabel label="Phase Duration" />
                <div>{formatDuration(positionStats.challengePeriod)}</div>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Challenger" />
                <Link
                  className="text-link"
                  href={challengerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortenAddress(challenge?.challenger || zeroAddress)}
                </Link>
              </AppBox>
            </div>
            <div className="mx-auto mt-4 w-72 max-w-full flex-col">
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
          </div>
        </section>
      </div>
    </>
  );
}
