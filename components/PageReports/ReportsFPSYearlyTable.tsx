import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { ApiFpsYearlyRow } from "@frankencoin/api";
import ReportsFPSYearlyRow from "./ReportsFPSYearlyRow";

export type AccountYearly = { year: number; earnings: bigint; balance: bigint; value: bigint };

interface Props {
	address: Address;
	rows: ApiFpsYearlyRow[];
}

export default function ReportsFPSYearlyTable({ address, rows }: Props) {
	const headers: string[] = ["Year", "Income", "Balance", "Value"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const accountYearly: AccountYearly[] = rows.map((r) => ({
		year: r.year,
		earnings: BigInt(r.earnings),
		balance: BigInt(r.balance),
		value: BigInt(r.value),
	}));

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
					<TableRowEmpty>{"There are no earnings accounted yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<ReportsFPSYearlyRow
							headers={headers}
							tab={tab}
							key={`ReportsFPSYearlyRow_${idx}_${r.year}`}
							address={address}
							item={r}
						/>
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
		sortingList.sort((a, b) => parseInt(b.earnings.toString()) - parseInt(a.earnings.toString()));
	} else if (tab === headers[2]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance.toString()) - parseInt(a.balance.toString()));
	} else if (tab === headers[3]) {
		// Value
		sortingList.sort((a, b) => Number(b.value) - Number(a.value));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
