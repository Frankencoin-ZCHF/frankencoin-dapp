import { useRouter } from "next/router";
import { useState } from "react";
import { formatUnits, getAddress, zeroAddress } from "viem";
import { usePositionStats } from "@hooks";
import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import SwapFieldInput from "@components/SwapFieldInput";
import DisplayAmount from "@components/DisplayAmount";
import { abs, formatBigInt, shortenAddress } from "@utils";
import Button from "@components/Button";
import { erc20ABI, useAccount, useChainId, useContractWrite } from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";

export default function PositionAdjust() {
  const router = useRouter();
  const { address: positionAddr } = router.query;
  const { address } = useAccount();
  const chainId = useChainId();
  const position = getAddress(String(positionAddr || zeroAddress));
  const positionStats = usePositionStats(position);

  const [isConfirming, setIsConfirming] = useState(false);
  const [amount, setAmount] = useState(positionStats.minted);
  const [collateralAmount, setCollateralAmount] = useState(
    positionStats.collateralBal
  );
  const [liqPrice, setLiqPrice] = useState(positionStats.liqPrice);

  const maxRepayable =
    (1_000_000n * positionStats.frankenBalance) /
    (1_000_000n - positionStats.reserveContribution);
  const repayPosition =
    maxRepayable > positionStats.minted
      ? 0n
      : positionStats.minted - maxRepayable;

  const paidOutAmount = () => {
    if (amount > positionStats.minted) {
      return (
        ((amount - positionStats.minted) *
          (1_000_000n -
            positionStats.reserveContribution -
            positionStats.mintingFee)) /
        1_000_000n
      );
    } else {
      return amount - positionStats.minted - returnFromReserve();
    }
  };

  const returnFromReserve = () => {
    return (
      (positionStats.reserveContribution * (amount - positionStats.minted)) /
      1_000_000n
    );
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
    setAmount(BigInt(value));
  };

  const onChangeCollAmount = (value: string) => {
    setCollateralAmount(BigInt(value));
  };

  function getCollateralError() {
    if (
      collateralAmount - positionStats.collateralBal >
      positionStats.collateralUserBal
    ) {
      return `Insufficient ${positionStats.collateralSymbol} in your wallet.`;
    } else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
      return "Not enough collateral for the given price and borrow amount.";
    } else {
      return "";
    }
  }

  function getAmountError() {
    if (amount > positionStats.limit) {
      return `This position is limited to ${formatUnits(
        positionStats.limit,
        18
      )} ZCHF`;
    } else if (-paidOutAmount() > positionStats.frankenBalance) {
      return "Insufficient ZCHF in wallet";
    } else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
      return "Amount too high for the given price and collateral.";
    } else {
      return "";
    }
  }

  const onChangeLiqAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setLiqPrice(valueBigInt);
  };

  const approveWrite = useContractWrite({
    address: positionStats.collateral,
    abi: erc20ABI,
    functionName: "approve",
  });

  const handleApprove = async () => {
    const tx = await approveWrite.writeAsync({
      args: [position, collateralAmount - positionStats.collateralBal],
    });

    const toastContent = [
      {
        title: "Amount:",
        value: formatBigInt(collateralAmount, positionStats.collateralDecimal),
      },
      {
        title: "Spender: ",
        value: shortenAddress(position),
      },
      {
        title: "Transaction:",
        hash: tx.hash,
      },
    ];

    await toast.promise(
      waitForTransaction({ hash: tx.hash, confirmations: 1 }),
      {
        pending: {
          render: (
            <TxToast
              title={`Approving ${positionStats.collateralSymbol}`}
              rows={toastContent}
            />
          ),
        },
        success: {
          render: (
            <TxToast
              title={`Successfully Approved ${positionStats.collateralSymbol}`}
              rows={toastContent}
            />
          ),
        },
        error: {
          render(error: any) {
            return renderErrorToast(error);
          },
        },
      }
    );
  };
  const adjustWrite = useContractWrite({
    address: position,
    abi: ABIS.PositionABI,
    functionName: "adjust",
  });
  const handleAdjust = async () => {
    const tx = await adjustWrite.writeAsync({
      args: [amount, collateralAmount, liqPrice],
    });

    const toastContent = [
      {
        title: "Amount:",
        value: formatBigInt(amount),
      },
      {
        title: "Collateral Amount:",
        value: formatBigInt(collateralAmount, positionStats.collateralDecimal),
      },
      {
        title: "Liquidation Price:",
        value: formatBigInt(liqPrice),
      },
      {
        title: "Transaction:",
        hash: tx.hash,
      },
    ];

    await toast.promise(
      waitForTransaction({ hash: tx.hash, confirmations: 1 }),
      {
        pending: {
          render: <TxToast title={`Adjusting Position`} rows={toastContent} />,
        },
        success: {
          render: (
            <TxToast
              title="Successfully Adjusted Position"
              rows={toastContent}
            />
          ),
        },
        error: {
          render(error: any) {
            return renderErrorToast(error);
          },
        },
      }
    );
  };

  return (
    <>
      <Head>
        <title>Frankencoin - Adjust Position</title>
      </Head>
      <div>
        <AppPageHeader
          title="Adjust Position"
          backText="Back to position"
          backTo={`/position/${positionAddr}`}
        />
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center">Variables</div>
            <SwapFieldInput
              label="Amount"
              symbol="ZCHF"
              balanceLabel="Min:"
              max={repayPosition}
              value={amount.toString()}
              onChange={onChangeAmount}
              error={getAmountError()}
              placeholder="Loan Amount"
            />
            <SwapFieldInput
              label="Collateral"
              balanceLabel="Max:"
              symbol={positionStats.collateralSymbol}
              max={
                positionStats.collateralUserBal + positionStats.collateralBal
              }
              value={collateralAmount.toString()}
              onChange={onChangeCollAmount}
              digit={positionStats.collateralDecimal}
              note={collateralNote}
              error={getCollateralError()}
              placeholder="Collateral Amount"
            />
            <SwapFieldInput
              label="Liquidation Price"
              balanceLabel="Current Value"
              symbol={"ZCHF"}
              max={positionStats.liqPrice}
              value={liqPrice.toString()}
              digit={36 - positionStats.collateralDecimal}
              onChange={onChangeLiqAmount}
              placeholder="Liquidation Price"
            />
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {collateralAmount - positionStats.collateralBal >
              positionStats.collateralPosAllowance ? (
                <Button
                  isLoading={approveWrite.isLoading || isConfirming}
                  onClick={() => handleApprove()}
                >
                  Approve Collateral
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={
                    (amount == positionStats.minted && collateralAmount == positionStats.collateralBal && liqPrice == positionStats.liqPrice) ||
                    !!getAmountError() ||
                    !!getCollateralError()
                  }
                  error={
                    positionStats.owner != address
                      ? "You can only adjust your own position"
                      : ""
                  }
                  isLoading={adjustWrite.isLoading}
                  onClick={() => handleAdjust()}
                >
                  Adjust Position
                </Button>
              )}
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center">Outcome</div>
            <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex">
                <div className="flex-1">Current minted amount</div>
                <DisplayAmount
                  amount={positionStats.minted}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                />
              </div>
              <div className="flex">
                <div className="flex-1">
                  {amount >= positionStats.minted
                    ? "You receive"
                    : "You return"}
                </div>
                <DisplayAmount
                  amount={paidOutAmount()}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                />
              </div>
              <div className="flex">
                <div className="flex-1">
                  {amount >= positionStats.minted
                    ? "Added to reserve on your behalf"
                    : "Returned from reserve"}
                </div>
                <DisplayAmount
                  amount={returnFromReserve()}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                />
              </div>
              <div className="flex">
                <div className="flex-1">Minting fee (interest)</div>
                <DisplayAmount
                  amount={
                    amount > positionStats.minted
                      ? ((amount - positionStats.minted) *
                          positionStats.mintingFee) /
                        1_000_000n
                      : 0n
                  }
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                />
              </div>
              <hr className="border-slate-700 border-dashed" />
              <div className="flex font-bold">
                <div className="flex-1">Future minted amount</div>
                <DisplayAmount
                  amount={amount}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
