import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsSavedQuery } from "@frankencoin/api";
import SavingsSavedRow from "./SavingsSavedRow";

export default function GovernanceLeadrateTable() {
	const headers: string[] = ["Date", "Saver", "Amount", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { save } = useSelector((state: RootState) => state.savings.savingsAllUserTable);
	if (!save) return null;

	const sorted: SavingsSavedQuery[] = sortFunction({ list: save, headers, tab, reverse });

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
				{sorted.length == 0 ? (
					<TableRowEmpty>{"There are no savings yet."}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsSavedRow headers={headers} tab={tab} key={r.id} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}

type sortFunctionParams = {
	list: SavingsSavedQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: sortFunctionParams): SavingsSavedQuery[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Saver
		sortingList.sort((a, b) => a.account.localeCompare(b.account));
	} else if (tab === headers[2]) {
		// Amount
		sortingList.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
	} else if (tab === headers[3]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
