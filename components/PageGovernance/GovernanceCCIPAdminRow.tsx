import TableRow from "../Table/TableRow";
import AppLink from "@components/AppLink";
import { ChainId, SupportedChain, SupportedChainsMap } from "@frankencoin/zchf";
import { ApiCCIPProposal } from "../../redux/slices/bridge.types";
import { ContractUrl, getChainByChainSelector, shortenAddress, TxUrl } from "@utils";
import { Address, Hash } from "viem";
import GovernanceCCIPAdminDenyAction from "./GovernanceCCIPAdminDenyAction";
import GovernanceCCIPAdminEnactAction from "./GovernanceCCIPAdminEnactAction";

interface Props {
	headers: string[];
	tab: string;
	proposal: ApiCCIPProposal;
}

const TYPE_LABEL: Record<string, string> = {
	AddChain: "Add Chain",
	RemoveChain: "Remove Chain",
	RemotePoolUpdate: "Pool Update",
	AdminTransfer: "Admin Transfer",
};

function StatusCell({ proposal }: { proposal: ApiCCIPProposal }) {
	const chain = SupportedChainsMap[proposal.chainId as ChainId] as SupportedChain;
	if (proposal.status === "Denied" || proposal.status === "Enacted") {
		return (
			<AppLink
				className=""
				label={proposal.status}
				href={TxUrl((proposal.deniedTxHash ?? proposal.enactedTxHash ?? "") as Hash, chain)}
				external={true}
			/>
		);
	}

	const msLeft = proposal.deadline * 1000 - Date.now();
	const hoursLeft = msLeft / 1000 / 60 / 60;
	const countdown = msLeft <= 0 ? "Ready" : hoursLeft < 24 ? `${Math.round(hoursLeft)}h left` : `${Math.round(hoursLeft / 24)}d left`;
	return <span>{countdown}</span>;
}

function TypeCell({ proposal }: { proposal: ApiCCIPProposal }) {
	let detail: string | null = null;
	if (proposal.details) {
		try {
			const d = JSON.parse(proposal.details);
			if (proposal.type === "AddChain" || proposal.type === "RemoveChain") {
				const selector = d.remoteChainSelector ?? d.chain;
				detail = getChainByChainSelector(String(selector))?.name ?? `#${selector}`;
			} else if (proposal.type === "RemotePoolUpdate") {
				const chainName = getChainByChainSelector(String(d.chain))?.name ?? `#${d.chain}`;
				detail = `${d.add ? "+" : "−"} ${chainName}`;
			} else if (proposal.type === "AdminTransfer" && d.newAdmin) {
				detail = shortenAddress(d.newAdmin as Address);
			}
		} catch {}
	}
	return (
		<div className="flex flex-col">
			<span>{TYPE_LABEL[proposal.type ?? ""] ?? proposal.type ?? "—"}</span>
			{detail && <span className="text-text-secondary text-sm">{detail}</span>}
		</div>
	);
}

export default function GovernanceCCIPAdminRow({ headers, tab, proposal }: Props) {
	const chain = SupportedChainsMap[proposal.chainId as ChainId] as SupportedChain;
	const dateArr = new Date(proposal.created * 1000).toDateString().split(" ");
	const dateStr = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	const isPending = proposal.status === "Pending";
	const deadlinePassed = proposal.deadline * 1000 < Date.now();

	const actionCol = isPending ? (
		deadlinePassed ? (
			<GovernanceCCIPAdminEnactAction proposal={proposal} />
		) : (
			<GovernanceCCIPAdminDenyAction proposal={proposal} />
		)
	) : (
		<span />
	);

	return (
		<TableRow headers={headers} rawHeader={true} tab={tab} actionCol={actionCol}>
			{/* Date → tx link */}
			<div className="flex flex-col md:text-left max-md:text-right">
				<AppLink className="" label={dateStr} href={TxUrl(proposal.txHash as Hash, chain)} external={true} />
			</div>

			{/* Proposer → address link */}
			<div className="flex flex-col">
				{proposal.proposer ? (
					<AppLink
						className=""
						label={shortenAddress(proposal.proposer as Address)}
						href={ContractUrl(proposal.proposer, chain)}
						external={true}
					/>
				) : (
					<span className="text-text-secondary">—</span>
				)}
			</div>

			{/* Chain (local chain where CCIPAdmin lives) */}
			<div className="flex flex-col">{chain?.name ?? proposal.chainId}</div>

			{/* Type + target chain detail */}
			<TypeCell proposal={proposal} />

			{/* Status: date/countdown + badge */}
			<StatusCell proposal={proposal} />
		</TableRow>
	);
}
