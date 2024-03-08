import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getAddress, zeroAddress, maxUint256 } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { usePositionStats, useTokenData } from "@hooks";
import { useState } from "react";
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
import AppBox from "@components/AppBox";
import DateInput from "@components/Input/DateInput";
import Link from "next/link";
import NormalInput from "@components/Input/NormalInput";
import AddressInput from "@components/Input/AddressInput";

export default function PositionCreate({}) {
  const router = useRouter();
  const [collAmount, setCollAmount] = useState(0n);
  const [limitAmount, setLimitAmount] = useState(10_000_000n * BigInt(1e18));
  const [liqPrice, setLiqPrice] = useState(0n);
  const [interest, setInterest] = useState(300n);
  const [maturity, setMaturity] = useState(12n);
  const [buffer, setBuffer] = useState(2000n);
  const [auctionDuration, setAuctionDuration] = useState(24n);
  const [collateralAddress, setCollateralAddress] = useState("");
  const [collAmountError, setCollAmountError] = useState("");
  const [collTokenAddrError, setCollTokenAddrError] = useState("");
  const [limitAmountError, setLimitAmountError] = useState("");
  const [interestError, setInterestError] = useState("");
  const [liqPriceError, setLiqPriceError] = useState("");
  const [bufferError, setBufferError] = useState("");
  const [auctionError, setAuctionError] = useState("");
  const [errorDate, setErrorDate] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const chainId = useChainId();
  const collTokenData = useTokenData(collateralAddress);

  useEffect(() => {
    if (collTokenData.name == "NaN") {
      setCollTokenAddrError("Please input valid ERC20 token contract");
    } else {
      setCollTokenAddrError("");
    }
  }, [collTokenData]);

  function toDate(blocktime: bigint) {
    return new Date(Number(blocktime) * 1000);
  }

  const onChangeCollAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setCollAmount(valueBigInt);
    if (valueBigInt > collTokenData.balance) {
      setCollAmountError(`Not enough ${collTokenData.symbol} in your wallet.`);
    } else {
      setCollAmountError("");
    }
  };

  const onChangeLimitAmount = (value: string) => {
    const valueBigInt = BigInt(value);
    setLimitAmount(valueBigInt);
    // TODO: Update conditions
    if (valueBigInt > collTokenData.balance) {
      setLimitAmountError(`Not enough ${collTokenData.symbol} in your wallet.`);
    } else {
      setLimitAmountError("");
    }
  };

  const onChangeCollateralAddress = (addr: string) => {
    setCollateralAddress(addr);
  };

  const onChangeInterest = (value: string) => {
    const valueBigInt = BigInt(value);
    setInterest(valueBigInt);

    if (valueBigInt >= 10000n) {
      setInterestError("Annual Interest Rate is too high");
    } else {
      setInterestError("");
    }
  };

  const onChangeMaturity = (value: string) => {
    const valueBigInt = BigInt(value);
    setMaturity(valueBigInt);
  };

  const onChangeLiqPrice = (value: string) => {
    const valueBigInt = BigInt(value);
    setLiqPrice(valueBigInt);
  };

  const onChangeBuffer = (value: string) => {
    const valueBigInt = BigInt(value);
    setBuffer(valueBigInt);
  };

  const onChangeAuction = (value: string) => {
    const valueBigInt = BigInt(value);
    setAuctionDuration(valueBigInt);
  };

  const approveWrite = useContractWrite({
    address: collTokenData.address,
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
        value: "infinite " + collTokenData.symbol,
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
              title={`Approving ${collTokenData.symbol}`}
              rows={toastContent}
            />
          ),
        },
        success: {
          render: (
            <TxToast
              title={`Successfully Approved ${collTokenData.symbol}`}
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

            <AddressInput
              label="Collateral Token"
              error={collTokenAddrError}
              placeholder="ERC20 Token Contract Address"
              value={collateralAddress}
              onChange={onChangeCollateralAddress}
            />
            <TokenInput
              label="Minimum Collateral"
              symbol={collTokenData.symbol}
              error={collAmountError}
              max={collTokenData.balance}
              value={collAmount.toString()}
              onChange={onChangeCollAmount}
              digit={collTokenData.decimals}
              placeholder="Minimum Collateral Amount"
            />
          </div>
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center mt-3">
              Financial Terms
            </div>
            <TokenInput
              label="Limit"
              hideMaxLabel
              symbol="ZCHF"
              error={limitAmountError}
              value={limitAmount.toString()}
              onChange={onChangeLimitAmount}
              placeholder="Limit Amount"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <NormalInput
                label="Annual Interest"
                symbol="%"
                error={interestError}
                digit={2}
                hideMaxLabel
                value={interest.toString()}
                onChange={onChangeInterest}
                placeholder="Annual Interest Percent"
              />
              <NormalInput
                label="Maturity"
                symbol="months"
                hideMaxLabel
                digit={0}
                value={maturity.toString()}
                onChange={onChangeMaturity}
                placeholder="Maturity"
              />
            </div>

            <div className="text-lg font-bold text-center mt-3">
              Liquidation
            </div>
            <TokenInput
              label="Liquidation Price"
              balanceLabel="Limit:"
              symbol="ZCHF"
              error={liqPriceError}
              hideMaxLabel
              value={liqPrice.toString()}
              onChange={onChangeLiqPrice}
              placeholder="Liquidation Price"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <NormalInput
                label="Buffer"
                symbol="%"
                error={bufferError}
                digit={2}
                hideMaxLabel
                value={buffer.toString()}
                onChange={onChangeBuffer}
                placeholder="Buffer Percent"
              />
              <NormalInput
                label="Auction Duration"
                symbol="hours"
                error={auctionError}
                hideMaxLabel
                digit={0}
                value={auctionDuration.toString()}
                onChange={onChangeAuction}
                placeholder="Auction Duration"
              />
            </div>
            <div className="mx-auto mt-8 w-72 max-w-full flex-col">
              {collAmount > collTokenData.balance ? (
                <Button
                  disabled={collAmount == 0n || !!collAmountError}
                  isLoading={approveWrite.isLoading || isConfirming}
                  onClick={() => handleApprove()}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={collAmount == 0n || !!collAmountError}
                  isLoading={cloneWrite.isLoading || isConfirming}
                  onClick={() => {}}
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
