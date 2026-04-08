import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { VoteDataQuote } from "@hooks";
import AppLink from "@components/AppLink";
import { ContractUrl } from "@utils";

interface Props {
	headers: string[];
	tab: string;
	voter: VoteDataQuote;
	votesTotal: bigint;
	connectedWallet?: boolean;
}

export default function GovernanceVotersRow({ headers, tab, voter, votesTotal, connectedWallet }: Props) {
	const votingPower = voter.votingPowerRatio + voter.supportedVotingPowerRatio;
	const supporterCount = voter.supporters.length;

	return (
		<>
			<TableRow className={connectedWallet ? "bg-card-content-primary" : undefined} headers={headers} rawHeader={true} tab={tab}>
				{/* Address + supporter count as sub-text */}
				<div className="flex flex-col md:text-left max-md:text-right max-md:w-full">
					{connectedWallet ? (
						<AppLink label={"Connected wallet"} href={ContractUrl(voter.holder)} external={true} className="" />
					) : (
						<AppLink label={shortenAddress(voter.holder)} href={ContractUrl(voter.holder)} external={true} className="" />
					)}
					{supporterCount > 0 && (
						<span className="text-sm text-text-subheader">
							{supporterCount} supporter{supporterCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>

				{/* Voting power + supported VP ratio as sub-text */}
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					<span>{formatCurrency(votingPower * 100)}%</span>
					{voter.supportedVotingPowerRatio > 0 && (
						<span className="text-sm text-text-subheader font-normal">
							{formatCurrency(voter.supportedVotingPowerRatio * 100)}%
						</span>
					)}
				</div>
			</TableRow>
		</>
	);
}
