import { formatBigInt, formatDate, formatDuration, isDateExpired, shortenAddress } from "@utils";
import AppBox from "./AppBox";
import Link from "next/link";
import { Address } from "viem";
import { useContractUrl } from "@hooks";
import Button from "./Button";
import { useChainId } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "./TxToast";
import { useState } from "react";
import { WAGMI_CONFIG } from "../app.config";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";

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
	const [isVetoing, setVetoing] = useState(false);

	const minterUrl = useContractUrl(minter.minter);
	const isVotingFinished = isDateExpired(BigInt(minter.applyDate) + BigInt(minter.applicationPeriod));
	const status = !minter.vetor ? (isVotingFinished ? "Passed" : "Active") : "Vetoed";

	const chainId = useChainId();

	const handleVeto = async () => {
		try {
			setVetoing(true);

			const vetoHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: FrankencoinABI,
				functionName: "denyMinter",
				args: [minter.minter, helpers, "No"],
			});

			const toastContent = [
				{
					title: "Reason:",
					value: "No",
				},
				{
					title: "Transaction:",
					hash: vetoHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: vetoHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Vetoing Proposal`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Vetoed" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setVetoing(false);
		}
	};

	return (
		<AppBox className="grid grid-cols-6 hover:bg-slate-700 duration-300">
			<div className="col-span-6 sm:col-span-5 pr-4">
				<div className="flex">
					<div>Date:</div>
					<div className="ml-auto">{formatDate(minter.applyDate)}</div>
				</div>
				<div className="flex">
					<div>Minter:</div>
					<Link href={minterUrl} target="_blank" rel="noreferrer" className="underline ml-auto">
						{shortenAddress(minter.minter)}
					</Link>
				</div>
				<div className="flex">
					<div>Comment:</div>
					<div className="ml-auto font-bold">{minter.applyMessage}</div>
				</div>
				<div className="flex">
					<div>Fee:</div>
					<div className="ml-auto">{formatBigInt(minter.applicationFee, 18)} ZCHF</div>
				</div>
				<div className="flex">
					<div>Voting Period:</div>
					<div className="ml-auto">{formatDuration(minter.applicationPeriod)}</div>
				</div>
			</div>
			<div className="col-span-6 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-dashed pt-4 sm:pl-4 mt-4 sm:mt-0 flex flex-col">
				<div
					className={`rounded-xl text-white text-center ${
						status == "Passed" ? "bg-green-800" : status == "Active" ? "bg-green-600" : "bg-gray-700"
					}`}
				>
					{status}
				</div>
				{status == "Active" && (
					<Button onClick={() => handleVeto()} className="mt-auto" isLoading={isVetoing}>
						Veto
					</Button>
				)}
			</div>
		</AppBox>
	);
}
