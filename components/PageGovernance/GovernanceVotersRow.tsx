import TableRow from "../Table/TableRow";
import { formatCurrency, normalizeAddress, shortenAddress } from "../../utils/format";
import { VoteDataQuote } from "@hooks";
import AppLink from "@components/AppLink";
import { ContractUrl } from "@utils";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

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
	const isWrapped = normalizeAddress(voter.holder) === normalizeAddress(ADDRESS[mainnet.id].wFPS);

	return (
		<>
			<TableRow className={connectedWallet ? "bg-card-content-primary" : undefined} headers={headers} rawHeader={true} tab={tab}>
				{/* Address + supporter count as sub-text */}
				<div className="flex flex-col md:text-left max-md:text-right max-md:w-full">
					<div className="flex items-center gap-2">
						{connectedWallet ? (
							<AppLink label={"Connected wallet"} href={ContractUrl(voter.holder)} external={true} className="" />
						) : (
							<AppLink label={shortenAddress(voter.holder)} href={ContractUrl(voter.holder)} external={true} className="" />
						)}
						{isWrapped && (
							<span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
								Wrapped
							</span>
						)}
					</div>
					{supporterCount > 0 && (
						<span className="text-sm text-text-subheader">
							{supporterCount} supporter{supporterCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>

				{/* Voting power + supported VP ratio as sub-text */}
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					<span>{formatCurrency(votingPower * 100)}%</span>
					{supporterCount > 0 && (
						<span className="text-sm text-text-subheader font-normal">
							{formatCurrency(voter.supportedVotingPowerRatio * 100)}%
						</span>
					)}
				</div>
			</TableRow>
		</>
	);
}
