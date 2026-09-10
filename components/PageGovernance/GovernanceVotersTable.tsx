import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useState } from "react";
import { useVotingPowers, VoteDataQuote, VotingSystem } from "@hooks";
import GovernanceVotersRow from "./GovernanceVotersRow";
import { useConnection, useReadContract } from "wagmi";
import { normalizeAddress } from "../../utils/format";
import { ADDRESS, FCSABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

// Always shown on the FPS1 tab regardless of DISPLAY_THRESHOLD — it's FCS's aggregate pooled voting
// power (see GovernanceVotersRow's isFcsWrapper), not an individual holder, so it stays relevant
// context even while FCS adoption is still small.
const ALWAYS_SHOWN: Partial<Record<VotingSystem, string>> = {
	fps1: normalizeAddress(ADDRESS[mainnet.id].interestGovernance),
};

// Display-only cutoff for the ranking list — matches each system's real on-chain quorum
// (Governance.sol: QUORUM = 200 for the already-deployed FPS1 Equity contract = 2%, vs. 100 for
// FCS's freshly-deployed MainnetVotes/BridgedVotes = 1%). Not a qualification gate itself — see
// GuardQualifiedVoter for where that's enforced.
const DISPLAY_THRESHOLD: Record<VotingSystem, number> = {
	fps1: 0.02,
	fcs: 0.01,
};

interface Props {
	system?: VotingSystem;
}

export default function GovernanceVotersTable({ system = "fps1" }: Props) {
	const headers: string[] = ["Address", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { address } = useConnection();
	const { votesData, accountVoteData, totalVotes } = useVotingPowers(system);

	// FCS.shoot() only becomes available once FCS is binding — determines whether the FPS1 tab's row
	// action is "Shoot" (FCS contract, target-only) or "Kamikaze" (Equity, self-sacrifice budget).
	const { data: fcsIsBindingData } = useReadContract({
		address: ADDRESS[mainnet.id].fcs,
		chainId: mainnet.id,
		abi: FCSABI,
		functionName: "isBinding",
		query: { enabled: system === "fps1" },
	});
	const fcsIsBinding = fcsIsBindingData ?? false;

	// Caller's own raw votes on this system's token — spent as the sacrifice budget for kamikaze/attack.
	const myVotes = accountVoteData?.votingPower ?? 0n;

	const otherVotes = votesData.filter((v) => !address || normalizeAddress(v.holder) !== normalizeAddress(address));

	const alwaysShown = ALWAYS_SHOWN[system];
	const sorted = sortVotes({ votes: otherVotes, headers, tab, reverse }).filter(
		(i) =>
			i.votingPowerRatio + i.supportedVotingPowerRatio > DISPLAY_THRESHOLD[system] ||
			(alwaysShown && normalizeAddress(i.holder) === alwaysShown)
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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				<>
					{accountVoteData && (
						<GovernanceVotersRow
							headers={headers}
							tab={tab}
							voter={accountVoteData}
							votesTotal={totalVotes}
							system={system}
							myVotes={myVotes}
							fcsIsBinding={fcsIsBinding}
							connectedWallet
						/>
					)}
					{sorted.length === 0 ? (
						<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
					) : (
						sorted.map((vote) => (
							<GovernanceVotersRow
								key={vote.holder}
								headers={headers}
								tab={tab}
								voter={vote}
								votesTotal={totalVotes}
								system={system}
								myVotes={myVotes}
								fcsIsBinding={fcsIsBinding}
							/>
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
