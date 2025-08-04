import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { LeadrateProposedOpen } from "@frankencoin/api";
import GovernanceLeadrateRow from "./GovernanceLeadrateRow";
import { mainnet } from "viem/chains";

export default function GovernanceLeadrateTable() {
	const headers: string[] = ["Date", "Proposer", "Module", "Proposed Rate", "State"];
	const [tab, setTab] = useState<string>(headers[4]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<LeadrateProposedOpen[]>([]);

	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const open = info.open[mainnet.id] || {};

	const sorted: LeadrateProposedOpen[] = sortFunction({
		list: Object.values(open),
		headers,
		tab,
		reverse,
	});

	useEffect(() => {
		const idList = list.map((l) => [l.details.chainId, l.details.module, l.details.created].join("-")).join("_");
		const idSorted = sorted.map((l) => [l.details.chainId, l.details.module, l.details.created].join("-")).join("_");
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
					<TableRowEmpty>{"There are no open proposals."}</TableRowEmpty>
				) : (
					list.map((p, idx) => (
						<GovernanceLeadrateRow
							headers={headers}
							tab={tab}
							key={[p.details.chainId, p.details.module, p.details.created].join("-") || `GovernanceLeadrateRow_${idx}`}
							proposal={p}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: LeadrateProposedOpen[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

// @dev: for sorting priorities
enum SortFunctionState {
	Ready,
	TimeLeft,
}

function sortFunction(params: SortFunctionParams): LeadrateProposedOpen[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.details.created - a.details.created);
	} else if (tab === headers[1]) {
		// Proposer
		sortingList.sort((a, b) => a.details.proposer.localeCompare(b.details.proposer));
	} else if (tab === headers[2]) {
		// Rate
		sortingList.sort((a, b) => b.nextRate - a.nextRate);
	} else if (tab === headers[3]) {
		// State
		sortingList.sort((a, b) => {
			const calc = function (l: LeadrateProposedOpen): number {
				const vetoUntil = l.nextChange * 1000;
				const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;

				if (hoursUntil > 0) return SortFunctionState.TimeLeft;
				else return SortFunctionState.Ready;
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
