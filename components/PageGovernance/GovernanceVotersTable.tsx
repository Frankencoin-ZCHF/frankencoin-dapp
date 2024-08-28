import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { ChallengesPositionsMapping, PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useState } from "react";
import { useFPSHolders } from "@hooks";
import { useVotingPowers } from "../../hooks/useVotingPowers";
import GovernanceVotersRow from "./GovernanceVotersRow";

export type VoteData = {
	holder: Address;
	fps: bigint;
	votingPower: bigint;
	votingPowerRatio: number;
};

export default function GovernanceVotersTable() {
	const headers: string[] = ["Owner", "FPS", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[2]);
	const [reverse, setReverse] = useState<boolean>(false);

	const fpsHolders = useFPSHolders();
	const votingPowersHook = useVotingPowers(fpsHolders.holders);
	const votesTotal = votingPowersHook.totalVotes;
	const votesData: VoteData[] = votingPowersHook.votesData.map((vp) => {
		const ratio: number = parseInt(vp.votingPower.toString()) / parseInt(votesTotal.toString());
		return {
			holder: vp.holder as Address,
			fps: BigInt(vp.fps),
			votingPower: vp.votingPower as bigint,
			votingPowerRatio: ratio,
		};
	});

	const votesDataSorted: VoteData[] = sortVotes({
		votes: votesData,
		headers,
		reverse,
		tab,
	});

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{votesDataSorted.length == 0 ? (
					<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
				) : (
					votesDataSorted.map((vote) => <GovernanceVotersRow key={vote.holder} voter={vote} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortVotes = {
	votes: VoteData[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortVotes(params: SortVotes): VoteData[] {
	const { votes, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		votes.sort((a, b) => a.holder.localeCompare(b.holder));
	} else if (tab === headers[1]) {
		votes.sort((a, b) => parseInt(b.fps.toString()) - parseInt(a.fps.toString()));
	} else if (tab === headers[2]) {
		votes.sort((a, b) => b.votingPowerRatio - a.votingPowerRatio);
	}

	return reverse ? votes.reverse() : votes;
}
