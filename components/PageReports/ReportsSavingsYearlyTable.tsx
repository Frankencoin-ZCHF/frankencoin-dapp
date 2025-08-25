import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import { SavingsActivityQuery } from "@frankencoin/api";
import ReportsSavingsYearlyRow from "./ReportsSavingsYearlyRow";

export type AccountYearly = { year: number; collected: bigint; balance: bigint };

interface Props {
	activity: SavingsActivityQuery[];
}

export default function ReportsYearlyTable({ activity }: Props) {
	const headers: string[] = ["Year", "Interest Collected", "Year End Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const accountYears: string[] = activity
		.map((i) => new Date(i.created * 1000).getFullYear().toString())
		.reduce<string[]>((a, b) => {
			return a.includes(b) ? a : [...a, b];
		}, []);

	const accountYearly: AccountYearly[] = [];

	for (const y of accountYears) {
		const items = activity.filter((i) => new Date(i.created * 1000).getFullYear().toString() == y);
		const collected = items
			.filter((i) => i.kind == "InterestCollected")
			.reduce<bigint>((a, b) => {
				return a + BigInt(b.amount);
			}, 0n);
		const balance = BigInt(items.at(0)?.balance || 0n);

		accountYearly.push({
			year: parseInt(y),
			collected,
			balance,
		});
	}

	const sorted: AccountYearly[] = sortFunction({ list: accountYearly, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.year}_${l.balance}`).join("_");
		const idSorted = sorted.map((l) => `${l.year}_${l.balance}`).join("_");
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
					<TableRowEmpty>{"No savings found"}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<ReportsSavingsYearlyRow headers={headers} tab={tab} key={`ReportsSavingsYearlyRow_${idx}_${r.year}`} item={r} />
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
