import LogsRow from "./LogsRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";

export default function LogsTable() {
	const headers: string[] = [
		"Date",
		"Tx Kind",
		"Tx Amount",
		"ZCHF Supply",
		"In Equity",
		"In Savings",
		"FPS Price",
		"FPS Supply",
		"Earnings 365days",
		"Per FPS (accum.)",
	];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { logs } = useSelector((state: RootState) => state.dashboard.txLog);

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
				{logs.length == 0 ? (
					<TableRowEmpty>{"There are no logs yet."}</TableRowEmpty>
				) : (
					logs.map((l, idx) => <LogsRow headers={headers} tab={tab} log={l} key={`${l.id}-${l.amount}-logs_row_${idx}`} />)
				)}
			</TableBody>
		</Table>
	);
}
