import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import DisplayAmount from "../components/DisplayAmount";
import {
  useAccount,
  useChainId,
  useContractWrite,
  useNetwork,
  useWaitForTransaction,
} from "wagmi";
import { useFaucetStats } from "../hooks";
import { TOKEN_LOGO, shortenHash } from "../utils";
import Button from "../components/Button";
import { ABIS, ADDRESS } from "../contracts";
import { useRef, useState } from "react";
import { Address, Hash, parseUnits, zeroAddress } from "viem";
import { Id, toast } from "react-toastify";
import { TxToast } from "../components/TxToast";

interface RowProps {
  addr: Address;
  symbol: string;
  balance: bigint;
  decimal: bigint;
}

export function FaucetRow({ symbol, balance, decimal, addr }: RowProps) {
  const { address } = useAccount();
  const toastId = useRef<Id>(0);
  const [pendingTx, setPendingTx] = useState<Hash>(zeroAddress);
  const account = address || zeroAddress;

  const { isLoading: mintLoading, writeAsync: mint } = useContractWrite({
    address: addr,
    abi: ABIS.MockVolABI,
    functionName: "mint",
    onSuccess(data) {
      toastId.current = toast.loading(
        <TxToast
          title={`Fauceting ${symbol}`}
          rows={[
            {
              title: "Amount :",
              value: "1000 " + symbol,
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
    <div className="rounded-lg bg-white dark:bg-slate-800 p-8 xl:px-16">
      <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
        <div className="grid flex-grow grid-cols-2 gap-3 sm:grid-cols-3 items-center">
          <div>
            <div className="text-gray-400 md:hidden">Token</div>
            <picture className="mr-2 flex items-center">
              <img
                src={TOKEN_LOGO[symbol.toLowerCase()]}
                className="w-8"
                alt="token-logo"
              />
              <span className="ml-2 font-bold">{symbol}</span>
            </picture>
          </div>
          <div>
            <div className="text-gray-400 md:hidden">Decimals</div>
            {decimal.toString()}
          </div>
          <div>
            <div className="text-gray-400 md:hidden">My Balance</div>
            <DisplayAmount
              amount={balance}
              digits={decimal}
              currency={symbol}
              hideLogo
            />
          </div>
        </div>
        <div className="flex-shrink-0 md:w-40">
          <Button
            variant="primary"
            isLoading={mintLoading || isConfirming}
            onClick={() =>
              mint({ args: [account, parseUnits("1000", Number(decimal))] })
            }
          >
            +1000 {symbol}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Faucet() {
  const chains = useNetwork();
  const chainId = useChainId();
  const faucetStats = useFaucetStats();

  if (!chains.chain?.testnet) return <></>;

  return (
    <>
      <Head>FrankenCoin - Faucet</Head>
      <div>
        <AppPageHeader title="Faucets" />
        <section>
          <div className="space-y-3">
            <div className="hidden items-center justify-between rounded-lg bg-white dark:bg-slate-800 py-5 px-8 md:flex xl:px-16">
              <div className="hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-3">
                <span className="leading-tight">Token</span>
                <span className="leading-tight">Decimals</span>
                <span className="leading-tight">My Balance</span>
              </div>
              <div className="w-40 flex-shrink-0"></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:gap-2">
              <FaucetRow
                addr={ADDRESS[chainId].xchf}
                symbol={faucetStats.xchfSymbol}
                decimal={faucetStats.xchfDecimals}
                balance={faucetStats.xchfUserBal}
              />
              <FaucetRow
                addr={ADDRESS[chainId].mockVol || zeroAddress}
                symbol={faucetStats.volSymbol}
                decimal={faucetStats.volDecimals}
                balance={faucetStats.volUserBal}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
