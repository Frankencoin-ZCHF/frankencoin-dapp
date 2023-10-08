import { useRouter } from "next/router";
import { useState } from "react";
import { Hash, formatUnits, getAddress, parseUnits, zeroAddress } from "viem";
import { usePositionStats } from "@hooks";
import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import AppBox from "@components/AppBox";
import SwapFieldInput from "@components/SwapFieldInput";
import DisplayAmount from "@components/DisplayAmount";
import { abs } from "@utils";
import Button from "@components/Button";
import {
  erc20ABI,
  useAccount,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import DisplayLabel from "@components/DisplayLabel";

export default function PositionAdjust({}) {
  const router = useRouter();
  const [amountError, setAmountError] = useState("");
  const [collError, setCollError] = useState("");
  const [amount, setAmount] = useState(0n);
  const [collateralAmount, setCollateralAmount] = useState(0n);
  const [liqPrice, setLiqPrice] = useState(0n);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const { address: positionAddr } = router.query;

  const { address } = useAccount();
  const position = getAddress(String(positionAddr || zeroAddress));
  const positionStats = usePositionStats(position);

  const repayPosition =
    positionStats.minted > positionStats.frankenBalance
      ? positionStats.minted - positionStats.frankenBalance
      : 0n;
  const additionalAmount = amount - positionStats.minted;
  const isNegativeDiff = additionalAmount < 0;
  const borrowReserveContribution =
    (positionStats.reserveContribution * additionalAmount) / 1_000_000n;
  const fees = (additionalAmount * positionStats.mintingFee) / 1_000_000n;

  const paidOutAmount = () => {
    const reserveAndFees = borrowReserveContribution + fees;

    if (isNegativeDiff) {
      return abs(additionalAmount - fees) - reserveAndFees;
    } else {
      return additionalAmount - reserveAndFees;
    }
  };

  const collateralNote =
    collateralAmount < positionStats.collateralBal
      ? `${formatUnits(
          abs(collateralAmount - positionStats.collateralBal),
          positionStats.collateralDecimal
        )} ${positionStats.collateralSymbol} sent back to your wallet`
      : collateralAmount > positionStats.collateralBal
      ? `${formatUnits(
          abs(collateralAmount - positionStats.collateralBal),
          positionStats.collateralDecimal
        )} ${positionStats.collateralSymbol} taken from your wallet`
      : "";

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);
    if (valueBigInt > positionStats.limit) {
      setAmountError(
        `This position is limited to ${formatUnits(
          positionStats.limit,
          18
        )} ZCHF`
      );
    } else if (
      isNegativeDiff &&
      paidOutAmount() > positionStats.frankenBalance
    ) {
      setAmountError("Insufficient ZCHF amount in wallet");
    } else {
      setAmountError("");
    }
  };

  const onChangeCollAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setCollateralAmount(valueBigInt);
    if (
      valueBigInt > positionStats.collateralBal &&
      valueBigInt - positionStats.collateralBal >
        positionStats.collateralUserBal
    ) {
      setCollError(
        `Insufficient ${positionStats.collateralSymbol} in your wallet.`
      );
    } else {
      setCollError("");
    }
  };

  const onChangeLiqAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setLiqPrice(valueBigInt);
    // setError(valueBigInt > fromBalance)
  };

  const { isLoading: approveLoading, write: approveCollateral } =
    useContractWrite({
      address: positionStats.collateral,
      abi: erc20ABI,
      functionName: "approve",
      onSuccess(data) {
        setPendingTx(data.hash);
      },
    });

  const { isLoading: adjustLoading, write: adjustPos } = useContractWrite({
    address: position,
    abi: ABIS.PositionABI,
    functionName: "adjust",
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

  return (
    <>
      <Head>
        <title>Frankencoin - Adjust Position</title>
      </Head>
      <div>
        <AppPageHeader
          title="Adjust Your Position"
          backText="Back to position"
          backTo={`/position/${positionAddr}`}
        />
        <section className="grid grid-cols-2 gap-x-4">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center">Adjust Details</div>
            <SwapFieldInput
              label="Amount"
              symbol="ZCHF"
              max={repayPosition}
              value={amount.toString()}
              onChange={onChangeAmount}
              error={amountError}
              // TODO: Children
            />
            <SwapFieldInput
              label="Collateral"
              symbol={positionStats.collateralSymbol}
              max={positionStats.collateralUserBal}
              value={collateralAmount.toString()}
              onChange={onChangeCollAmount}
              digit={positionStats.collateralDecimal}
              note={collateralNote}
              error={collError}
              // TODO: Children
            />
            <SwapFieldInput
              label="Liquidation Price"
              symbol={"ZCHF"}
              max={positionStats.liqPrice}
              value={liqPrice.toString()}
              onChange={onChangeLiqAmount}
              // TODO: Children
            />
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {collateralAmount > positionStats.collateralPosAllowance ? (
                <Button
                  variant="secondary"
                  isLoading={approveLoading || isConfirming}
                  onClick={() =>
                    approveCollateral({ args: [position, collateralAmount] })
                  }
                >
                  Approve Collateral
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={amount == 0n || !!amountError || !!collError}
                  error={
                    positionStats.owner != address
                      ? "You can only adjust your own position"
                      : ""
                  }
                  isLoading={adjustLoading}
                  onClick={() =>
                    adjustPos({
                      args: [amount, collateralAmount, liqPrice],
                    })
                  }
                >
                  Adjust Position
                </Button>
              )}
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center">
              Position Preview
            </div>
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-2">
                <AppBox>
                  <DisplayLabel label="Current Amount" />
                  <DisplayAmount
                    amount={positionStats.minted}
                    currency={"ZCHF"}
                  />
                </AppBox>
                <AppBox>
                  <DisplayLabel
                    label={
                      isNegativeDiff ? "Taken in wallet" : "Received in wallet"
                    }
                  />
                  <DisplayAmount amount={paidOutAmount()} currency={"ZCHF"} />
                </AppBox>
                <AppBox>
                  <DisplayLabel
                    label={
                      isNegativeDiff
                        ? "Taken from reserve"
                        : "Reserve contribution"
                    }
                  />
                  <DisplayAmount
                    amount={borrowReserveContribution}
                    currency={"ZCHF"}
                  />
                </AppBox>
                <AppBox>
                  <DisplayLabel label="Fee" />
                  <DisplayAmount amount={fees} currency={"ZCHF"} />
                </AppBox>
              </div>
              <hr className="my-2 border-dashed border-slate-800" />
              <AppBox>
                <DisplayLabel label="New Amount" />
                <DisplayAmount amount={amount} currency={"ZCHF"} />
              </AppBox>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
