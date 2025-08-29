import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { OwnerPositionDebt, OwnerPositionFees, OwnerPositionValueLocked } from "../../pages/report";
import ReportsPositionsYearlyRow from "./ReportsPositionsYearlyRow";

export type AccountYearly = { year: number; interestPaid: bigint; openDebt: bigint; valueLocked: bigint };

interface Props {
	address: Address;
	ownerPositionFees: OwnerPositionFees[];
	ownerPositionDebt: OwnerPositionDebt[];
	ownerPositionValueLocked: OwnerPositionValueLocked[];
}

export default function ReportsPositionsYearlyTable({ address, ownerPositionFees, ownerPositionDebt, ownerPositionValueLocked }: Props) {
	const headers: string[] = ["Year", "Interest Paid", "Debt", "Collateral Value"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const entries = ownerPositionFees.map((i) => ({ year: new Date(i.t * 1000).getFullYear(), fee: i.f }));
	const entriesDebt = ownerPositionDebt.map((i) => ({ year: i.y, debt: i.d }));
	const entriesValueLocked = ownerPositionValueLocked.map((i) => ({ year: i.y, value: i.v }));

	const accountYears: string[] = [...entries, ...entriesDebt]
		.map((e) => String(e.year))
		.reduce<string[]>((a, b) => {
			return a.includes(b) ? a : [...a, b];
		}, [])
		.sort((a, b) => parseInt(a) - parseInt(b));

	const accountYearly: AccountYearly[] = [];

	for (const y of accountYears) {
		const items = entries.filter((e) => e.year == Number(y));

		const interestPaid = items.reduce<bigint>((a, b) => a + b.fee, 0n);
		const openDebt = entriesDebt.find((i) => i.year == Number(y))?.debt || 0n;
		const valueLocked = entriesValueLocked.find((i) => i.year == Number(y))?.value || 0n;

		accountYearly.push({
			year: parseInt(y),
			interestPaid,
			openDebt,
			valueLocked,
		});
	}

	const sorted: AccountYearly[] = sortFunction({ list: accountYearly, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.year}_${l.interestPaid}_${l.openDebt}_${l.valueLocked}`).join("_");
		const idSorted = sorted.map((l) => `${l.year}_${l.interestPaid}_${l.openDebt}_${l.valueLocked}`).join("_");
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
					<TableRowEmpty>{"There are no position costs accounted yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<ReportsPositionsYearlyRow
							headers={headers}
							tab={tab}
							key={`ReportsPositionsYearlyRow_${idx}_${r.year}`}
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
		// Fees Paid
		sortingList.sort((a, b) => parseInt(b.interestPaid.toString()) - parseInt(a.interestPaid.toString()));
	} else if (tab === headers[2]) {
		// Debt
		sortingList.sort((a, b) => parseInt(b.openDebt.toString()) - parseInt(a.openDebt.toString()));
	} else if (tab === headers[3]) {
		// Value
		sortingList.sort((a, b) => parseInt(b.valueLocked.toString()) - parseInt(a.valueLocked.toString()));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
