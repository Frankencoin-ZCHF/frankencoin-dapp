import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  formatUnits,
  getAddress,
  zeroAddress,
  maxUint256,
  isAddress,
} from "viem";
import SwapFieldInput from "@components/SwapFieldInput";
import { usePositionStats } from "@hooks";
import { useState } from "react";
import DisplayAmount from "@components/DisplayAmount";
import Button from "@components/Button";
import { erc20ABI, useAccount, useChainId, useContractWrite } from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import {
  formatBigInt,
  formatDate,
  min,
  shortenAddress,
  toTimestamp,
} from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faHourglassStart,
} from "@fortawesome/free-solid-svg-icons";
import AppBox from "@components/AppBox";
import DateFieldInput from "@components/DateFieldInput";
import Link from "next/link";

export default function PositionCreate({}) {
  const router = useRouter();
  const [amount, setAmount] = useState(0n);
  const [collateralAddress, setCollateralAddress] = useState("");
  const [error, setError] = useState("");
  const [errorDate, setErrorDate] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const { address: positionAddr } = router.query;

  const chainId = useChainId();
  const position = getAddress(String(positionAddr || zeroAddress));
  const positionStats = usePositionStats(position);
  const [expirationDate, setExpirationDate] = useState(new Date());
  const requiredColl =
    positionStats.liqPrice > 0 &&
    (BigInt(1e18) * amount) / positionStats.liqPrice >
      positionStats.minimumCollateral
      ? (BigInt(1e18) * amount) / positionStats.liqPrice
      : positionStats.minimumCollateral;

  useEffect(() => {
    // to set initial date during loading
    setExpirationDate(toDate(positionStats.expiration));
  }, [positionStats.expiration]);

  const borrowersReserveContribution =
    (positionStats.reserveContribution * amount) / 1_000_000n;

  function toDate(blocktime: bigint) {
    return new Date(Number(blocktime) * 1000);
  }

  // max(4 weeks, ((chosen expiration) - (current block))) * position.annualInterestPPM() / (365 days) / 1000000
  const feePercent =
    (BigInt(
      Math.max(
        60 * 60 * 24 * 30,
        Math.floor((expirationDate.getTime() - Date.now()) / 1000)
      )
    ) *
      positionStats.annualInterestPPM) /
    BigInt(60 * 60 * 24 * 365);
  const fees = (feePercent * amount) / 1_000_000n;
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

  const onChangeCollateralAddress = (e: any) => {
    setCollateralAddress(e.target.value);

    if (isAddress(e.target.value)) {
      setError("");
    } else {
      setError("Please input address in valid EOA address format.");
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

  const onChangeExpiration = (value: Date | null) => {
    if (!value) value = new Date();
    const newTimestamp = toTimestamp(value);
    const bottomLimit = toTimestamp(new Date());
    const uppperLimit = positionStats.expiration;

    if (newTimestamp < bottomLimit || newTimestamp > uppperLimit) {
      setErrorDate("Expiration Date should be between Now and Limit");
    } else {
      setErrorDate("");
    }
    setExpirationDate(value);
  };

  const onMaxExpiration = () => {
    setExpirationDate(toDate(positionStats.expiration));
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

  return (
    <>
      <Head>
        <title>Frankencoin - Create Position</title>
      </Head>
      <div>
        <AppPageHeader
          title="Create New Position"
          backText="Back to positions"
          backTo={`/positions`}
        />
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <p>
              Propose a completely new position with a collateral of your
              choice.
            </p>

            <div className="text-lg font-bold text-center mt-3">
              Initialization
            </div>
            <p>
              It is recommended to{" "}
              <Link
                href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions"
                target="_blank"
              >
                discuss
              </Link>{" "}
              new positions before initiating them to increase the probability
              of passing the decentralized governance process.
              <ol className="pl-6 list-disc">
                <li>Non-refundable initialization fee: 1000 ZCHF</li>
                <li>Initialization Period: 5 days</li>
              </ol>
            </p>

            <div className="text-lg font-bold text-center mt-3">Collateral</div>
            <p>
              Provide the contract address of the desired collateral. The
              minimum amount should be at least 5000 ZCHF worth of the
              collateral at the liquidation price.
            </p>

            <div className="mt-5">
              <div className="px-1 flex-1">Collateral Token</div>
              <div className="flex gap-2 items-center rounded-lg bg-slate-800 p-2">
                <div
                  className={`flex-1 gap-1 rounded-lg text-white p-1 bg-slate-600 border-2 ${
                    error
                      ? "border-red-300"
                      : "border-neutral-100 border-slate-600"
                  }`}
                >
                  <input
                    className="w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg"
                    placeholder="ERC20 Token Contract Address"
                    value={collateralAddress}
                    onChange={onChangeCollateralAddress}
                  />
                </div>
              </div>
              <div className="mt-2 px-1 text-red-500">{error}</div>
            </div>
            <SwapFieldInput
              label="Minimum Collateral"
              balanceLabel="Limit:"
              symbol="ZCHF"
              error={error}
              hideMaxLabel
              value={amount.toString()}
              onChange={onChangeAmount}
              placeholder="Minimum Collateral Amount"
            />
          </div>
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center mt-3">
              Financial Terms
            </div>
            <SwapFieldInput
              label="Initial Collateral"
              balanceLabel="Limit:"
              symbol=""
              error={error}
              max={availableAmount}
              value={amount.toString()}
              onChange={onChangeAmount}
              placeholder="Initial Collateral Amount"
            />
            <div className="flex gap-2">
              <DateFieldInput
                label="Maturity"
                max={positionStats.expiration}
                value={expirationDate}
                onChange={onChangeExpiration}
                error={errorDate}
              />
              <DateFieldInput
                label="Challenge"
                max={positionStats.expiration}
                value={expirationDate}
                onChange={onChangeExpiration}
                error={errorDate}
              />
            </div>

            <div className="text-lg font-bold text-center mt-3">
              Liquidation
            </div>
            <SwapFieldInput
              label="Liquidation Price"
              balanceLabel="Limit:"
              symbol="ZCHF"
              error={error}
              hideMaxLabel
              value={amount.toString()}
              onChange={onChangeAmount}
              placeholder="Liquidation Price"
            />
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {requiredColl > positionStats.collateralAllowance ? (
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
                  onClick={() => {}}
                  error={
                    requiredColl < positionStats.minimumCollateral
                      ? "A position must have at least " +
                        formatBigInt(
                          positionStats.minimumCollateral,
                          Number(positionStats.collateralDecimal)
                        ) +
                        " " +
                        positionStats.collateralSymbol
                      : ""
                  }
                >
                  Create Position
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
