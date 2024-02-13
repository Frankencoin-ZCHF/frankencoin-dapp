import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import {
  usePoolStats,
  useContractUrl,
  useFPSQuery,
  useTradeQuery,
} from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import {
  erc20ABI,
  useAccount,
  useChainId,
  useContractRead,
  useContractWrite,
} from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import SwapFieldInput from "@components/SwapFieldInput";
import { useState } from "react";
import { formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Pool() {
  const [amount, setAmount] = useState(0n);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const poolStats = usePoolStats();
  const equityUrl = useContractUrl(ADDRESS[chainId].equity);
  const { profit, loss } = useFPSQuery(ADDRESS[chainId].frankenCoin);
  const { trades } = useTradeQuery();
  const account = address || zeroAddress;

  const approveWrite = useContractWrite({
    address: ADDRESS[chainId].frankenCoin,
    abi: erc20ABI,
    functionName: "approve",
    args: [ADDRESS[chainId].equity, amount],
  });
  const investWrite = useContractWrite({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "invest",
  });
  const redeemWrite = useContractWrite({
    address: ADDRESS[chainId].equity,
    abi: ABIS.EquityABI,
    functionName: "redeem",
  });
  const handleApprove = async () => {
    const tx = await approveWrite.writeAsync();

    const toastContent = [
      {
        title: "Amount:",
        value: formatBigInt(amount) + " ZCHF",
      },
      {
        title: "Spender: ",
        value: shortenAddress(ADDRESS[chainId].equity),
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
  const handleInvest = async () => {
    const tx = await investWrite.writeAsync({ args: [amount, result] });

    const toastContent = [
      {
        title: "Amount:",
        value: formatBigInt(amount, 18) + " ZCHF",
      },
      {
        title: "Shares: ",
        value: formatBigInt(result) + " FPS",
      },
      {
        title: "Transaction: ",
        hash: tx.hash,
      },
    ];

    await toast.promise(
      waitForTransaction({ hash: tx.hash, confirmations: 1 }),
      {
        pending: {
          render: <TxToast title={`Investing ZCHF`} rows={toastContent} />,
        },
        success: {
          render: <TxToast title="Successfully Invested" rows={toastContent} />,
        },
        error: {
          render(error: any) {
            return renderErrorToast(error);
          },
        },
      }
    );
  };
  const handleRedeem = async () => {
    const tx = await redeemWrite.writeAsync({ args: [account, amount] });

    const toastContent = [
      {
        title: "Amount:",
        value: formatBigInt(amount) + " FPS",
      },
      {
        title: "Receive: ",
        value: formatBigInt(result) + " ZCHF",
      },
      {
        title: "Transaction: ",
        hash: tx.hash,
      },
    ];

    await toast.promise(
      waitForTransaction({ hash: tx.hash, confirmations: 1 }),
      {
        pending: {
          render: <TxToast title={`Redeeming FPS`} rows={toastContent} />,
        },
        success: {
          render: <TxToast title="Successfully Redeemed" rows={toastContent} />,
        },
        error: {
          render(error: any) {
            return renderErrorToast(error);
          },
        },
      }
    );
  };

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
      <Head>
        <title>Frankencoin - Pool Shares</title>
      </Head>
      <div>
        <AppPageHeader title="Frankencoin Pool Shares (FPS)" link={equityUrl} />
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col">
            <div className="text-lg font-bold text-center">Pool Details</div>
            <div className="p-4 mt-5">
              <SwapFieldInput
                max={fromBalance}
                symbol={fromSymbol}
                onChange={onChangeAmount}
                value={amount.toString()}
                error={error}
                placeholder={fromSymbol + " Amount"}
              />
              <div className="py-4 text-center z-0">
                <button
                  className={`btn btn-secondary z-0 text-slate-800 w-14 h-14 rounded-full transition ${
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
                hideMaxLabel
                output={formatUnits(result, 18)}
                label="Receive"
              />
              <div
                className={`mt-2 px-1 transition-opacity ${
                  (shareLoading || proceedLoading) && "opacity-50"
                }`}
              >
                {conversionNote()}
                <br />
                {!direction && "Redemption requires a 90 days holding period."}
              </div>

              <div className="mx-auto mt-8 w-72 max-w-full flex-col">
                {direction ? (
                  amount > poolStats.frankenAllowance ? (
                    <Button
                      isLoading={approveWrite.isLoading || isConfirming}
                      disabled={amount == 0n || !!error}
                      onClick={() => handleApprove()}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={amount == 0n || !!error}
                      isLoading={investWrite.isLoading || isConfirming}
                      onClick={() => handleInvest()}
                    >
                      Invest
                    </Button>
                  )
                ) : (
                  <Button
                    variant="primary"
                    isLoading={redeemWrite.isLoading || isConfirming}
                    disabled={
                      amount == 0n || !!error || !poolStats.equityCanRedeem
                    }
                    onClick={() => handleRedeem()}
                  >
                    Redeem
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-5 bg-slate-900 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <AppBox>
                <DisplayLabel label="Your Balance" />
                <DisplayAmount
                  amount={poolStats.equityBalance}
                  currency="FPS"
                  address={ADDRESS[chainId].equity}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Value at Current Price" />
                <DisplayAmount
                  amount={
                    (poolStats.equityPrice * poolStats.equityBalance) /
                    BigInt(1e18)
                  }
                  currency="ZCHF"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Holding Duration" />
                {poolStats.equityBalance > 0
                  ? formatDuration(poolStats.equityHoldingDuration)
                  : "-"}
              </AppBox>
              <AppBox className="flex-1">
                <DisplayLabel label="Can redeem after" />
                {formatDuration(redeemLeft)}
              </AppBox>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 grid grid-cols-1 gap-2">
            <div id="chart-timeline">
              <div className="flex justify-between">
                <div>
                  <DisplayLabel label="FPS Price" />
                  <DisplayAmount
                    amount={poolStats.equityPrice}
                    currency="ZCHF"
                  />
                </div>
                <div className="text-right">
                  <DisplayLabel label="Supply" />
                  <DisplayAmount
                    amount={poolStats.equitySupply}
                    currency="FPS"
                  />
                </div>
              </div>
              <ApexChart
                type="area"
                options={{
                  theme: {
                    mode: "dark",
                    palette: "palette1",
                  },
                  chart: {
                    type: "area",
                    height: 300,
                    toolbar: {
                      show: false,
                    },
                    zoom: {
                      enabled: false,
                    },
                    background: "transparent",
                  },
                  stroke: {
                    curve: "straight",
                    width: 2,
                  },
                  dataLabels: {
                    enabled: false,
                  },
                  grid: {
                    borderColor: "#39394a9c",
                  },
                  yaxis: {
                    show: false,
                  },
                  xaxis: {
                    type: "datetime",
                    labels: {
                      show: false,
                    },
                    axisTicks: {
                      show: false,
                    },
                  },
                  fill: {
                    type: "gradient",
                    gradient: {
                      shadeIntensity: 0,
                      opacityTo: 0,
                    },
                  },
                  tooltip: {
                    x: {
                      format: "dd MMM yyyy",
                    },
                  },
                }}
                series={[
                  {
                    name: "FPS Price",
                    data: trades.map((trade, i) => {
                      return [
                        parseFloat(trade.time) * 1000,
                        parseFloat(formatBigInt(BigInt(trade.price), 18, 3)),
                      ];
                    }),
                  },
                ]}
              />
            </div>
            <div className="bg-slate-900 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <AppBox>
                <DisplayLabel label="Market Cap" />
                <DisplayAmount
                  amount={
                    (poolStats.equitySupply * poolStats.equityPrice) /
                    BigInt(1e18)
                  }
                  currency="ZCHF"
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Reserve" />
                <DisplayAmount
                  amount={poolStats.frankenTotalReserve}
                  currency="ZCHF"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Equity Capital" />
                <DisplayAmount
                  amount={poolStats.frankenEquity}
                  currency="ZCHF"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Minter Reserve" />
                <DisplayAmount
                  amount={poolStats.frankenMinterReserve}
                  currency="ZCHF"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Income" />
                <DisplayAmount
                  amount={profit}
                  currency="ZCHF"
                  className="text-green-300"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Losses" />
                <DisplayAmount
                  amount={loss}
                  currency="ZCHF"
                  className="text-rose-400"
                  address={ADDRESS[chainId].frankenCoin}
                />
              </AppBox>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
