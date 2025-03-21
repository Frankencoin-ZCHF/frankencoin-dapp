import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { ApiLeadrateInfo, LeadrateProposed } from "@frankencoin/api";
import GovernanceLeadrateRow from "./GovernanceLeadrateRow";

export default function GovernanceLeadrateTable() {
	const headers: string[] = ["Date", "Proposer", "Proposed Rate", "State"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<LeadrateProposed[]>([]);

	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const proposals = useSelector((state: RootState) => state.savings.leadrateProposed);

	const currentProposal = proposals.list.length > 0 ? proposals.list[0] : undefined;
	const sorted: LeadrateProposed[] = sortFunction({ list: proposals.list.slice(0, 5), info, currentProposal, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.id}-${l.blockheight}`).join("_");
		const idSorted = sorted.map((l) => `${l.id}-${l.blockheight}`).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

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
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no proposals yet."}</TableRowEmpty>
				) : (
					list.map((p, idx) => (
						<GovernanceLeadrateRow
							headers={headers}
							tab={tab}
							key={p.id}
							info={info}
							proposal={p}
							currentProposal={currentProposal?.id == p.id}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: LeadrateProposed[];
	info: ApiLeadrateInfo;
	currentProposal: LeadrateProposed | undefined;
	headers: string[];
	tab: string;
	reverse: boolean;
};

// @dev: for sorting priorities
enum SortFunctionState {
	Expired,
	Passed,
	Ready,
	TimeLeft,
}

function sortFunction(params: SortFunctionParams): LeadrateProposed[] {
	const { list, currentProposal, info, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Proposer
		sortingList.sort((a, b) => a.proposer.localeCompare(b.proposer));
	} else if (tab === headers[2]) {
		// Rate
		sortingList.sort((a, b) => b.nextRate - a.nextRate);
	} else if (tab === headers[3]) {
		// State
		sortingList.sort((a, b) => {
			const calc = function (l: LeadrateProposed): number {
				const vetoUntil = l.nextChange * 1000;
				const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;

				// {currentProposal ? (hoursUntil > 0 ? stateStr : info.rate != proposal.nextRate ? "Ready" : "Passed") : "Expired"}
				if (currentProposal?.id == l.id) {
					if (hoursUntil > 0) return SortFunctionState.TimeLeft;
					else if (info.rate != l.nextRate) return SortFunctionState.Ready;
					else return SortFunctionState.Passed;
				} else {
					return SortFunctionState.Expired;
				}
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
