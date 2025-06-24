import { Address, Hash } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, EquityABI, SavingsABI } from "@frankencoin/zchf";
import { ApiLeadrateInfo, LeadrateProposed } from "@frankencoin/api";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { toast } from "react-toastify";
import { renderErrorTxToast, renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import AppLink from "@components/AppLink";
import { ContractUrl, TxUrl } from "@utils";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	headers: string[];
	tab: string;
	info: ApiLeadrateInfo;
	proposal: LeadrateProposed;
	currentProposal: boolean;
}

export default function GovernanceLeadrateRow({ headers, tab, info, proposal, currentProposal }: Props) {
	const [isDenying, setDenying] = useState<boolean>(false);
	const [isApplying, setApplying] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);

	const chainId = mainnet.id;

	const vetoUntil = proposal.nextChange * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = `${hoursUntil < 10 && hoursUntil > 0 ? Math.round(hoursUntil * 10) / 10 : Math.round(hoursUntil)} hours left`;

	const dateArr: string[] = new Date(proposal.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	const handleOnApply = async function (e: any) {
		e.preventDefault();

		try {
			setApplying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsReferral,
				chainId: chainId,
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
			toast.error(renderErrorTxToast(error));
		} finally {
			setApplying(false);
		}
	};

	const handleOnDeny = async function (e: any) {
		e.preventDefault();

		try {
			setDenying(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsReferral,
				chainId: chainId,
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
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setDenying(false);
		}
	};

	return (
		<>
			<TableRow
				paddingY={currentProposal && proposal.nextRate != info.rate ? "md:py-0 max-md:py-4" : undefined}
				headers={headers}
				tab={tab}
				rawHeader={true}
				actionCol={
					currentProposal && info.isProposal ? (
						info.isPending ? (
							<GuardSupportedChain disabled={!info.isPending || !info.isProposal} chain={mainnet}>
								<Button
									className="h-10"
									disabled={!info.isPending || !info.isProposal || isHidden}
									isLoading={isDenying}
									onClick={(e) => handleOnDeny(e)}
								>
									Deny
								</Button>
							</GuardSupportedChain>
						) : !info.isPending ? (
							<GuardSupportedChain disabled={!info.isProposal} chain={mainnet}>
								<Button
									className="h-10"
									disabled={!info.isProposal || isHidden}
									isLoading={isApplying}
									onClick={(e) => handleOnApply(e)}
								>
									Apply
								</Button>
							</GuardSupportedChain>
						) : (
							<></>
						)
					) : (
						<></>
					)
				}
			>
				<div className="flex flex-col md:text-left max-md:text-right">
					<AppLink label={dateStr} href={TxUrl(proposal.txHash as Hash)} external={true} className="" />
				</div>

				<div className="flex flex-col">
					<AppLink label={shortenAddress(proposal.proposer)} href={ContractUrl(proposal.proposer)} external={true} className="" />
				</div>

				<div className={`flex flex-col ${currentProposal && info.isProposal ? "font-semibold" : ""}`}>
					{proposal.nextRate / 10_000} %
				</div>

				<div className={`flex flex-col`}>
					{currentProposal ? (info.rate != proposal.nextRate ? (hoursUntil > 0 ? stateStr : "Ready") : "Passed") : "Inactive"}
				</div>
			</TableRow>
		</>
	);
}
