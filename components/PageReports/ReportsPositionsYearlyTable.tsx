import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { OwnerPositionFees } from "../../pages/reports";
import ReportsPositionsYearlyRow from "./ReportsPositionsYearlyRow";

export type AccountYearly = { year: number; otherCosts: bigint; interestPaid: bigint };

interface Props {
	address: Address;
	ownerPositionFees: OwnerPositionFees[];
}

export default function ReportsPositionsYearlyTable({ address, ownerPositionFees }: Props) {
	const headers: string[] = ["Year", "Other Costs", "Interest Paid"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const entries = ownerPositionFees.map((i) => ({ year: new Date(i.t * 1000).getFullYear(), fee: i.f }));

	const accountYears: string[] = entries
		.map((e) => String(e.year))
		.reduce<string[]>((a, b) => {
			return a.includes(b) ? a : [...a, b];
		}, []);

	const accountYearly: AccountYearly[] = [];

	for (const y of accountYears) {
		const items = entries.filter((e) => e.year == Number(y)) ?? [];
		const interestPaid = items.reduce<bigint>((a, b) => a + b.fee, 0n);

		accountYearly.push({
			year: parseInt(y),
			otherCosts: 0n,
			interestPaid,
		});
	}

	const sorted: AccountYearly[] = sortFunction({ list: accountYearly, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.year}_${l.interestPaid}`).join("_");
		const idSorted = sorted.map((l) => `${l.year}_${l.interestPaid}`).join("_");
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
		// Other Costs
		sortingList.sort((a, b) => parseInt(b.otherCosts.toString()) - parseInt(a.otherCosts.toString()));
	} else if (tab === headers[2]) {
		// Fees Paid
		sortingList.sort((a, b) => parseInt(b.interestPaid.toString()) - parseInt(a.interestPaid.toString()));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
