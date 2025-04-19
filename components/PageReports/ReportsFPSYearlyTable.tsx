import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import { FPSEarningsHistory } from "../../hooks/FPSEarningsHistory";
import { FPSBalanceHistory } from "../../hooks/FPSBalanceHistory";
import { Address } from "viem";
import ReportsFPSYearlyRow from "./ReportsFPSYearlyRow";

export type AccountYearly = { year: number; earnings: bigint; balance: bigint };

interface Props {
	address: Address;
	fpsHistory: FPSBalanceHistory[];
	fpsEarnings: FPSEarningsHistory[];
}

export default function ReportsFPSYearlyTable({ address, fpsHistory, fpsEarnings }: Props) {
	const headers: string[] = ["Year", "Income", "Balance", "Value"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AccountYearly[]>([]);

	const entriesRaw = fpsHistory.map((item, idx) => {
		// console.log(typeof item.created);
		const balance = item.to == address.toLowerCase() ? item.balanceTo : item.balanceFrom;
		const firstDate = item.created * 1000;
		const lastDate = idx == fpsHistory.length - 1 ? Date.now() : fpsHistory[idx + 1].created * 1000;
		const earnings = fpsEarnings.filter((i) => i.created * 1000 >= firstDate && i.created * 1000 < lastDate);

		const accounting: AccountYearly[] = earnings.map((e) => ({
			year: new Date(e.created * 1000).getFullYear(),
			earnings: e.perFPS,
			balance: balance,
		}));

		return accounting;
	});

	const entries = entriesRaw.flat();

	const accountYears: string[] = entries
		.map((e) => String(e.year))
		.reduce<string[]>((a, b) => {
			return a.includes(b) ? a : [...a, b];
		}, []);

	const accountYearly: AccountYearly[] = [];
	let latestBalance: bigint = 0n;

	for (const y of accountYears) {
		const items = entries.filter((e) => e.year == Number(y)) ?? [];
		const earningsMul = items.reduce<bigint>((a, b) => a + b.balance * b.earnings, 0n);
		const earnings = earningsMul / BigInt(10 ** 18);

		const fpsYearly = fpsHistory.filter((i) => new Date(i.created * 1000).getFullYear() == Number(y));

		if (fpsYearly.at(-1) != undefined) {
			const latestItem = fpsYearly.at(-1)!;
			latestBalance = latestItem.to == address.toLowerCase() ? latestItem.balanceTo : latestItem.balanceFrom;
		}

		accountYearly.push({
			year: parseInt(y),
			earnings,
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
	}

	return reverse ? sortingList.reverse() : sortingList;
}
