import {
  formatBigInt,
  formatDate,
  formatDuration,
  isDateExpired,
  shortenAddress,
} from "@utils";
import AppBox from "./AppBox";
import Link from "next/link";
import { Address } from "viem";
import { useContractUrl } from "@hooks";
import Button from "./Button";
import { useChainId, useContractWrite } from "wagmi";
import { ADDRESS, ABIS } from "@contracts";

interface Props {
  minter: Minter;
  helpers: Address[];
}

interface Minter {
  id: string;
  minter: Address;
  applicationPeriod: bigint;
  applicationFee: bigint;
  applyMessage: string;
  applyDate: bigint;
  suggestor: string;
  denyMessage: string;
  denyDate: string;
  vetor: string;
}

export default function MinterProposal({ minter, helpers }: Props) {
  const minterUrl = useContractUrl(minter.minter);
  const isVotingFinished = isDateExpired(
    BigInt(minter.applyDate) + BigInt(minter.applicationPeriod)
  );
  const status = !minter.vetor
    ? isVotingFinished
      ? "Passed"
      : "Active"
    : "Vetoed";

  const chainId = useChainId();
  const { isLoading, write: veto } = useContractWrite({
    address: ADDRESS[chainId].frankenCoin,
    abi: ABIS.FrankencoinABI,
    functionName: "denyMinter",
    args: [minter.minter, helpers, "Bad"],
  });

  return (
    <AppBox className="grid grid-cols-6 hover:bg-slate-700 duration-300">
      <div className="col-span-5 pr-4">
        <div className="flex">
          <div>Date:</div>
          <div className="ml-auto">{formatDate(minter.applyDate)}</div>
        </div>
        <div className="flex">
          <div>Minter:</div>
          <Link
            href={minterUrl}
            target="_blank"
            rel="noreferrer"
            className="underline ml-auto"
          >
            {shortenAddress(minter.minter)}
          </Link>
        </div>
        <div className="flex">
          <div>Comment:</div>
          <div className="ml-auto font-bold">{minter.applyMessage}</div>
        </div>
        <div className="flex">
          <div>Fee:</div>
          <div className="ml-auto">
            {formatBigInt(minter.applicationFee, 18)} ZCHF
          </div>
        </div>
        <div className="flex">
          <div>Voting Period:</div>
          <div className="ml-auto">
            {formatDuration(minter.applicationPeriod)}
          </div>
        </div>
      </div>
      <div className="col-span-1 border-l border-dashed pl-4 flex flex-col">
        <div
          className={`rounded-xl text-white text-center ${
            status == "Passed"
              ? "bg-green-800"
              : status == "Active"
              ? "bg-green-600"
              : "bg-gray-700"
          }`}
        >
          {status}
        </div>
        {status == "Vetoed" && (
          <Button onClick={() => veto()} className="mt-auto">
            Veto
          </Button>
        )}
      </div>
    </AppBox>
  );
}
