import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { SavingsBalance } from "@frankencoin/api";
import SavingsRankedBalancesRow from "./SavingsRankedBalancesRow";

export default function SavingsRankedBalancesTable() {
	const headers: string[] = ["Activity", "Saver", "Chain", "Claimed", "Balance"];
	const [tab, setTab] = useState<string>(headers[4]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<SavingsBalance[]>([]);

	const ranked = useSelector((state: RootState) => state.savings.savingsRanked);

	const sorted: SavingsBalance[] = sortFunction({ list: ranked, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.chainId}-${l.account}`).join("_");
		const idSorted = sorted.map((l) => `${l.chainId}-${l.account}`).join("_");
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
					<TableRowEmpty>{"There are no rankings yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<SavingsRankedBalancesRow
							headers={headers}
							tab={tab}
							key={`${r.chainId}-${r.account}` || `SavingsRankedBalancesRow_${idx}`}
							item={r}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: SavingsBalance[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): SavingsBalance[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Saver
		sortingList.sort((a, b) => b.account.localeCompare(a.account));
	} else if (tab === headers[2]) {
		// Chain
		sortingList.sort((a, b) => b.chainId - a.chainId);
	} else if (tab === headers[3]) {
		// Amount
		sortingList.sort((a, b) => parseInt(b.interest) - parseInt(a.interest));
	} else if (tab === headers[4]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
