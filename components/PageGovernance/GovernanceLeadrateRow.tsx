import { Hash } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency } from "../../utils/format";
import { AddressLabelSimple, TxLabelSimple } from "@components/AddressLabel";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CONFIG, WAGMI_CONFIG } from "../../app.config";
import { useAccount } from "wagmi";
import { ADDRESS, SavingsABI } from "@frankencoin/zchf";
import { ApiLeadrateInfo, LeadrateProposed } from "@frankencoin/api";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";

interface Props {
	headers: string[];
	info: ApiLeadrateInfo;
	proposal: LeadrateProposed;
	currentProposal: boolean;
}

export default function GovernanceLeadrateRow({ headers, info, proposal, currentProposal }: Props) {
	const [isDenying, setDenying] = useState<boolean>(false);
	const [isApplying, setApplying] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);

	const account = useAccount();
	const chainId = CONFIG.chain.id;

	const vetoUntil = proposal.nextChange * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = `${Math.round(hoursUntil)} hours left`;

	const dateArr: string[] = new Date(proposal.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	const handleOnApply = async function (e: any) {
		e.preventDefault();

		try {
			setApplying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "applyChange",
				args: [],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(info.rate / 10000)}%`,
				},
				{
					title: `Applying to: `,
					value: `${formatCurrency(proposal.nextRate / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Applying new rate...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully applied" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(<TxToast title="Something did not work..." rows={[{ title: "Did you reject the Transaction?" }]} />, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
		} finally {
			setApplying(false);
		}
	};

	const handleOnDeny = async function (e: any) {
		e.preventDefault();

		try {
			setDenying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [info.rate, []],
			});

			const toastContent = [
				{
					title: `Current: `,
					value: `${formatCurrency(info.rate / 10000)}%`,
				},
				{
					title: `Denying: `,
					value: `${formatCurrency(proposal.nextRate / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Denying new rate...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully denied" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(<TxToast title="Something did not work..." rows={[{ title: "Did you reject the Transaction?" }]} />, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
		} finally {
			setDenying(false);
		}
	};

	return (
		<>
			<TableRow
				headers={headers}
				actionCol={
					currentProposal ? (
						info.isPending && info.isProposal ? (
							<GuardToAllowedChainBtn label="Deny" disabled={!info.isPending || !info.isProposal}>
								<Button
									className="h-10"
									disabled={!info.isPending || !info.isProposal || isHidden}
									isLoading={isDenying}
									onClick={(e) => handleOnDeny(e)}
								>
									Deny
								</Button>
							</GuardToAllowedChainBtn>
						) : (
							<GuardToAllowedChainBtn label="Apply" disabled={!info.isProposal}>
								<Button
									className="h-10"
									disabled={!info.isProposal || isHidden}
									isLoading={isApplying}
									onClick={(e) => handleOnApply(e)}
								>
									Apply
								</Button>
							</GuardToAllowedChainBtn>
						)
					) : (
						<></>
					)
				}
			>
				<div className="flex flex-col md:text-left max-md:text-right">
					<TxLabelSimple label={dateStr} tx={proposal.txHash as Hash} showLink />
				</div>

				<div className="flex flex-col">
					<AddressLabelSimple address={proposal.proposer} showLink />
				</div>

				<div className={`flex flex-col ${currentProposal && info.isProposal ? "font-semibold" : ""}`}>
					{proposal.nextRate / 10_000} %
				</div>

				<div className="flex flex-col">
					{currentProposal ? (hoursUntil > 0 ? stateStr : info.rate != proposal.nextRate ? "Ready" : "Passed") : "Expired"}
				</div>
			</TableRow>
		</>
	);
}
