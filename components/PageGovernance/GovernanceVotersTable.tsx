import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useState } from "react";
import { useVotingPowers, VoteDataQuote } from "@hooks";
import GovernanceVotersRow from "./GovernanceVotersRow";
import { useAccount } from "wagmi";
import { normalizeAddress } from "../../utils/format";

export default function GovernanceVotersTable() {
	const headers: string[] = ["Address", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { address } = useAccount();
	const { votesData, accountVoteData, totalVotes } = useVotingPowers();

	const otherVotes = votesData.filter((v) => !address || normalizeAddress(v.holder) !== normalizeAddress(address));

	const sorted = sortVotes({ votes: otherVotes, headers, tab, reverse }).filter(
		(i) => i.votingPowerRatio + i.supportedVotingPowerRatio > 0.02
	);

	const handleTabOnChange = (e: string) => {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
			<TableBody>
				<>
					{accountVoteData && (
						<GovernanceVotersRow headers={headers} tab={tab} voter={accountVoteData} votesTotal={totalVotes} connectedWallet />
					)}
					{sorted.length === 0 ? (
						<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
					) : (
						sorted.map((vote) => (
							<GovernanceVotersRow key={vote.holder} headers={headers} tab={tab} voter={vote} votesTotal={totalVotes} />
						))
					)}
				</>
			</TableBody>
		</Table>
	);
}

type SortVotes = {
	votes: VoteDataQuote[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortVotes({ votes, headers, tab, reverse }: SortVotes): VoteDataQuote[] {
	const sorted = [...votes];

	if (tab === headers[0]) {
		sorted.sort((a, b) => a.holder.localeCompare(b.holder));
	} else if (tab === headers[1]) {
		sorted.sort((a, b) => (b.votingPower + b.supportedVotingPower > a.votingPower + a.supportedVotingPower ? 1 : -1));
	}

	return reverse ? sorted.reverse() : sorted;
}
