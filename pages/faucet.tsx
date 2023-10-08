import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import DisplayAmount from "@components/DisplayAmount";
import {
  useAccount,
  useChainId,
  useContractWrite,
  useNetwork,
  useWaitForTransaction,
} from "wagmi";
import { useFaucetStats } from "@hooks";
import { TOKEN_LOGO, shortenHash, transactionLink } from "@utils";
import Button from "@components/Button";
import { ABIS, ADDRESS } from "@contracts";
import { useRef, useState } from "react";
import { Address, Hash, parseUnits, zeroAddress } from "viem";
import { Id, toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRow from "@components/Table/TableRow";

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
              title: "Amount:",
              value: "1000 " + symbol,
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
                title: "Transaction:",
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
    <TableRow
      actionCol={
        <Button
          variant="primary"
          isLoading={mintLoading || isConfirming}
          onClick={() =>
            mint({ args: [account, parseUnits("1000", Number(decimal))] })
          }
        >
          +1000 {symbol}
        </Button>
      }
    >
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
    </TableRow>
  );
}

export default function Faucet() {
  const chains = useNetwork();
  const chainId = useChainId();
  const faucetStats = useFaucetStats();

  if (!chains.chain?.testnet) return <></>;

  return (
    <>
      <Head>
        <title>Frankencoin - Faucet</title>
      </Head>
      <div>
        <AppPageHeader title="Faucets" />
        <Table>
          <TableHeader
            headers={["Token", "Decimals", "My Balance"]}
            actionCol
          />
          <TableBody>
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
          </TableBody>
        </Table>
      </div>
    </>
  );
}
