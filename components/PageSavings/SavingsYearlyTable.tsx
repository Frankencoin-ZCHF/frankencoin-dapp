import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { SavingsInterestQuery, SavingsSavedQuery } from "@frankencoin/api";
import SavingsYearlyRow from "./SavingsYearlyRow";

export type AccountYearly = { year: number; collected: bigint; balance: bigint };

export default function SavingsYearlyTable() {
	const headers: string[] = ["Year", "Interest Collected", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const { interest, save } = useSelector((state: RootState) => state.savings.savingsUserTable);

	const mappedYearlySave: { [key: string]: SavingsSavedQuery[] } = {};
	const mappedYearly: { [key: string]: SavingsInterestQuery[] } = {};

	for (const i of interest) {
		const year = new Date(i.created * 1000).getFullYear();
		if (mappedYearly[year] == undefined) mappedYearly[year] = [];
		mappedYearly[year].push(i);
	}
	for (const i of save) {
		const year = new Date(i.created * 1000).getFullYear();
		if (mappedYearlySave[year] == undefined) mappedYearlySave[year] = [];
		mappedYearlySave[year].push(i);
	}

	const accountYearly: AccountYearly[] = [];

	for (const y of Object.keys(mappedYearly)) {
		const items = mappedYearly[y];
		const saveCreated = mappedYearlySave[y].at(-1)?.created ?? 0;
		const mappedCreated = items.at(-1)?.created ?? 0;
		const isSaveBalance = saveCreated > mappedCreated;
		const saveBalance = BigInt(mappedYearlySave[y].at(-1)?.balance ?? 0n);
		const mappedBalance = BigInt(items.at(-1)?.balance ?? 0n);

		accountYearly.push({
			year: parseInt(y),
			collected: items.reduce<bigint>((a, b) => {
				return a + BigInt(b.amount);
			}, 0n),
			balance: isSaveBalance ? saveBalance : mappedBalance,
		});
	}

	const sorted: AccountYearly[] = sortFunction({ list: accountYearly, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.year}_${l.collected}`).join("_");
		const idSorted = sorted.map((l) => `${l.year}_${l.collected}`).join("_");
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
					<TableRowEmpty>{"There are no savings yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<SavingsYearlyRow headers={headers} tab={tab} key={`SavingsYearlyRow_${idx}_${r.year}`} item={r} />
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: AccountYearly[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): AccountYearly[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Year
		sortingList.sort((a, b) => b.year - a.year);
	} else if (tab === headers[1]) {
		// Collected
		sortingList.sort((a, b) => parseInt(b.collected.toString()) - parseInt(a.collected.toString()));
	} else if (tab === headers[2]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance.toString()) - parseInt(a.balance.toString()));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
