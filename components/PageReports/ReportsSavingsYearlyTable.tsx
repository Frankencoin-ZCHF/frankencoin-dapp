import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
// import { SavingsInterestQuery, SavingsSavedQuery, SavingsWithdrawQuery } from "@frankencoin/api";
import ReportsSavingsYearlyRow from "./ReportsSavingsYearlyRow";

export type AccountYearly = { year: number; collected: bigint; balance: bigint };

interface Props {
	// save: SavingsInterestQuery[];
	// interest: SavingsInterestQuery[];
	// withdraw: SavingsWithdrawQuery[];
}

export default function ReportsYearlyTable() {
	// export default function ReportsYearlyTable({ save, interest, withdraw }: Props) {
	/*
	const headers: string[] = ["Year", "Interest Collected", "Year End Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const mappedYearlySave: { [key: string]: SavingsSavedQuery[] } = {};
	const mappedYearlyInterest: { [key: string]: SavingsInterestQuery[] } = {};
	const mappedYearlyWithdraw: { [key: string]: SavingsWithdrawQuery[] } = {};

	for (const i of save) {
		const year = new Date(i.created * 1000).getFullYear();
		if (mappedYearlySave[year] == undefined) mappedYearlySave[year] = [];
		mappedYearlySave[year].push(i);
	}

	for (const i of interest) {
		const year = new Date(i.created * 1000).getFullYear();
		if (mappedYearlyInterest[year] == undefined) mappedYearlyInterest[year] = [];
		mappedYearlyInterest[year].push(i);
	}

	for (const i of withdraw) {
		const year = new Date(i.created * 1000).getFullYear();
		if (mappedYearlyWithdraw[year] == undefined) mappedYearlyWithdraw[year] = [];
		mappedYearlyWithdraw[year].push(i);
	}

	const accountYears: string[] = [
		...Object.keys(mappedYearlySave),
		...Object.keys(mappedYearlyInterest),
		...Object.keys(mappedYearlyWithdraw),
	].reduce<string[]>((a, b) => {
		return a.includes(b) ? a : [...a, b];
	}, []);

	const accountYearly: AccountYearly[] = [];

	for (const y of accountYears) {
		const items = mappedYearlyInterest[y] ?? [];
		const saveCreated = mappedYearlySave[y]?.at(0)?.created ?? 0;
		const withdrawCreated = mappedYearlyWithdraw[y]?.at(0)?.created ?? 0;
		const interestCreated = items.at(0)?.created ?? 0;
		const saveBalance = BigInt(mappedYearlySave[y]?.at(0)?.balance ?? 0n);
		const interestBalance = BigInt(items.at(0)?.balance ?? 0n);
		const withdrawBalance = BigInt(mappedYearlyWithdraw[y]?.at(0)?.balance ?? 0n);
		const latestBalance =
			withdrawCreated > saveCreated && withdrawCreated >= interestCreated
				? withdrawBalance
				: saveCreated >= interestCreated
				? saveBalance
				: interestBalance;

		accountYearly.push({
			year: parseInt(y),
			collected: items.reduce<bigint>((a, b) => {
				return a + BigInt(b.amount);
			}, 0n),
			balance: latestBalance,
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
	*/
	return;
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
