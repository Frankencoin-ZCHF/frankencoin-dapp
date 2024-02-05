import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import { formatUnits, getAddress, zeroAddress, maxUint256 } from "viem";
import SwapFieldInput from "@components/SwapFieldInput";
import { usePositionStats } from "@hooks";
import { useState } from "react";
import DisplayAmount from "@components/DisplayAmount";
import Button from "@components/Button";
import { erc20ABI, useAccount, useChainId, useContractWrite } from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { formatBigInt, min, shortenAddress } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";

export default function PositionBorrow({}) {
  const router = useRouter();
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const { address: positionAddr } = router.query;

  const chainId = useChainId();
  const { address } = useAccount();
  const position = getAddress(String(positionAddr || zeroAddress));
  const positionStats = usePositionStats(position);

  const requiredColl =
    positionStats.liqPrice == 0n
      ? 0n
      : (BigInt(1e18) * amount) / positionStats.liqPrice;
  const borrowersReserveContribution =
    (positionStats.reserveContribution * amount) / 1_000_000n;
  const fees = (positionStats.mintingFee * amount) / 1_000_000n;
  const paidOutToWallet = amount - borrowersReserveContribution - fees;
  const availableAmount = positionStats.available;
  const userValue =
    (positionStats.collateralUserBal * positionStats.liqPrice) / BigInt(1e18);
  const borrowingLimit = min(availableAmount, userValue);

  const onChangeAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setAmount(valueBigInt);
    if (valueBigInt > borrowingLimit) {
      if (availableAmount > userValue) {
        setError(
          `Not enough ${positionStats.collateralSymbol} in your wallet.`
        );
      } else {
        setError("Not enough ZCHF available for this position.");
      }
    } else {
      setError("");
    }
  };

  const onChangeCollateral = (value: string) => {
    const valueBigInt = (BigInt(value) * positionStats.liqPrice) / BigInt(1e18);
    if (valueBigInt > borrowingLimit) {
      setError("Cannot borrow more than " + borrowingLimit + "." + valueBigInt);
    } else {
      setError("");
    }
    setAmount(valueBigInt);
  };

  const approveWrite = useContractWrite({
    address: positionStats.collateral,
    abi: erc20ABI,
    functionName: "approve",
  });
  const cloneWrite = useContractWrite({
    address: ADDRESS[chainId].mintingHub,
    abi: ABIS.MintingHubABI,
    functionName: "clone",
  });

  const handleApprove = async () => {
    const tx = await approveWrite.writeAsync({
      args: [ADDRESS[chainId].mintingHub, maxUint256],
    });

    const toastContent = [
      {
        title: "Amount:",
        value: "infinite " + positionStats.collateralSymbol,
      },
      {
        title: "Spender: ",
        value: shortenAddress(ADDRESS[chainId].mintingHub),
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
          render: <TxToast title={`Approving ZCHF`} rows={toastContent} />,
        },
        success: {
          render: (
            <TxToast title="Successfully Approved ZCHF" rows={toastContent} />
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
  const handleClone = async () => {
    const tx = await cloneWrite.writeAsync({
      args: [position, requiredColl, amount, positionStats.expiration],
    });

    const toastContent = [
      {
        title: `Amount: `,
        value: formatBigInt(amount) + " ZCHF",
      },
      {
        title: `Collateral: `,
        value:
          formatBigInt(requiredColl, positionStats.collateralDecimal) +
          " " +
          positionStats.collateralSymbol,
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
          render: <TxToast title={`Borrowing ZCHF`} rows={toastContent} />,
        },
        success: {
          render: (
            <TxToast title="Successfully Borrowed ZCHF" rows={toastContent} />
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
        <title>Frankencoin - Borrow</title>
      </Head>
      <div>
        <AppPageHeader
          title="Borrow"
          backText="Back to position"
          backTo={`/position/${position}`}
        />
        <section className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center mt-3">
              Borrow by Cloning an Existing Position
            </div>
            <div className="space-y-8">
              <SwapFieldInput
                label="Amount"
                balanceLabel="Limit:"
                symbol="ZCHF"
                error={error}
                max={availableAmount}
                value={amount.toString()}
                onChange={onChangeAmount}
                placeholder="Borrow Amount"
              />
              <SwapFieldInput
                showOutput
                label="Required Collateral"
                balanceLabel="Your balance:"
                max={positionStats.collateralUserBal}
                digit={positionStats.collateralDecimal}
                onChange={onChangeCollateral}
                output={formatUnits(
                  requiredColl,
                  positionStats.collateralDecimal
                )}
                symbol={positionStats.collateralSymbol}
              />
              <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex">
                  <div className="flex-1">Paid to your wallet</div>
                  <DisplayAmount
                    amount={paidOutToWallet}
                    currency="ZCHF"
                    address={ADDRESS[chainId].frankenCoin}
                  />
                </div>
                <div className="flex">
                  <div className="flex-1">Locked in borrowers reserve</div>
                  <DisplayAmount
                    amount={borrowersReserveContribution}
                    currency="ZCHF"
                    address={ADDRESS[chainId].frankenCoin}
                  />
                </div>
                <div className="flex">
                  <div className="flex-1">Fees</div>
                  <DisplayAmount
                    amount={fees}
                    currency="ZCHF"
                    address={ADDRESS[chainId].frankenCoin}
                  />
                </div>
                <hr className="border-slate-700 border-dashed" />
                <div className="flex font-bold">
                  <div className="flex-1">Total</div>
                  <DisplayAmount
                    amount={amount}
                    currency="ZCHF"
                    address={ADDRESS[chainId].frankenCoin}
                  />
                </div>
              </div>
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {amount > positionStats.collateralAllowance ? (
                <Button
                  disabled={amount == 0n || !!error}
                  isLoading={approveWrite.isLoading || isConfirming}
                  onClick={() => handleApprove()}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={amount == 0n || !!error}
                  isLoading={cloneWrite.isLoading || isConfirming}
                  error={
                    positionStats.owner == address
                      ? "You cannot clone your own position"
                      : ""
                  }
                  onClick={() => handleClone()}
                >
                  Clone Position
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
