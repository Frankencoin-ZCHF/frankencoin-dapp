import Table from "@components/Table";
import TableBody from "@components/Table/TableBody";
import TableHeader from "@components/Table/TableHead";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import { EquityTrade } from "@hooks";
import { useEffect, useState } from "react";
import EquityTradesRow from "./EquityTradesRow";

interface Props {
	trades: EquityTrade[];
}

export default function EquityTradesTable({ trades }: Props) {
	const headers: string[] = ["Date", "Amount", "Shares", "Price"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<EquityTrade[]>([]);

	const sorted = sortFunction({ list: trades, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => l.txHash).join("_");
		const idSorted = sorted.map((l) => l.txHash).join("_");
		if (idList !== idSorted) setList(sorted);
	}, [list, sorted]);

	const handleTabOnChange = (e: string) => {
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
				{list.length === 0 ? (
					<TableRowEmpty>{"No trades yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => <EquityTradesRow headers={headers} tab={tab} key={`EquityTradesRow_${idx}_${r.txHash}`} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: EquityTrade[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction({ list, headers, tab, reverse }: SortFunctionParams): EquityTrade[] {
	const sortingList = [...list];

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Amount
		sortingList.sort((a, b) => (b.amount > a.amount ? 1 : -1));
	} else if (tab === headers[2]) {
		// Shares
		sortingList.sort((a, b) => (b.shares > a.shares ? 1 : -1));
	} else if (tab === headers[3]) {
		// Price
		sortingList.sort((a, b) => (b.price > a.price ? 1 : -1));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
