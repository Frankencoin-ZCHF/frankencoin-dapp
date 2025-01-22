import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { SavingsInterestQuery } from "@frankencoin/api";
import SavingsInterestRow from "./SavingsInterestRow";

export default function SavingsInterestTable() {
	const headers: string[] = ["Date", "Saver", "Interest", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<SavingsInterestQuery[]>([]);

	const { interest } = useSelector((state: RootState) => state.savings.savingsAllUserTable);

	const sorted: SavingsInterestQuery[] = sortFunction({ list: interest, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => l.id).join("_");
		const idSorted = sorted.map((l) => l.id).join("_");
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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no interest claims yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => <SavingsInterestRow headers={headers} tab={tab} key={r.id} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: SavingsInterestQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): SavingsInterestQuery[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Saver
		sortingList.sort((a, b) => a.account.localeCompare(b.account));
	} else if (tab === headers[2]) {
		// Interest / Amount
		sortingList.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
	} else if (tab === headers[3]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
