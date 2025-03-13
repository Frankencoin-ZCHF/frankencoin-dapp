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
		"Earnings Annual",
		"Earn. FPS (accum.)",
	];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { logs } = useSelector((state: RootState) => state.dashboard.txLog);

	// @dev: sequence needs correction due to event triggering sequence from SCs
	const correctedLogs = logs.map((log, idx, all) => {
		if (idx > 0 && log.kind == "Equity:Profit" && log.timestamp == all[idx - 1].timestamp) {
			return all[idx - 1];
		} else if (idx < all.length - 1 && log.kind == "Frankencoin:Mint" && log.timestamp == all[idx + 1].timestamp) {
			return all[idx + 1];
		} else return log;
	});

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
				<div className="text-text-active">
					{correctedLogs.length == 0 ? (
						<TableRowEmpty>{"There are no logs yet."}</TableRowEmpty>
					) : (
						correctedLogs.map((l, idx) => (
							<LogsRow headers={headers} tab={tab} log={l} key={`${l.id}-${l.amount}-logs_row_${idx}`} />
						))
					)}
				</div>
			</TableBody>
		</Table>
	);
}
