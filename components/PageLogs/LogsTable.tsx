import LogsRow from "./LogsRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TabInput } from "@components/Input/TabInput";

export default function LogsTable() {
	const { logs } = useSelector((state: RootState) => state.dashboard.txLog);
	const [filterKind, setFilterKind] = useState("");
	const router = useRouter();

	const queryKind = router.query.kind?.toString();

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

	const keysByKind = logs
		.map((i) => i.kind.split(":")[0])
		.reduce<string[]>((a, b) => {
			if (a.includes(b)) return a;
			else return [...a, b];
		}, []);

	const filteredByKind = logs.filter((i) => {
		if (filterKind == "All") return true;
		return i.kind.split(":")[0].toLowerCase() == filterKind.toLowerCase();
	});

	useEffect(() => {
		if (filterKind.length > 0) return;
		if (queryKind == undefined) {
			setFilterKind("All");
			return;
		}

		setFilterKind(queryKind);
	}, [queryKind, filterKind]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<>
			<TabInput tabs={["All", ...keysByKind]} tab={filterKind} setTab={setFilterKind} />

			<Table>
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
				<TableBody>
					<div className="text-text-active">
						{filteredByKind.length == 0 ? (
							<TableRowEmpty>{"There are no logs yet."}</TableRowEmpty>
						) : (
							filteredByKind.map((l, idx) => (
								<LogsRow headers={headers} tab={tab} log={l} key={`${l.chainId}-${l.count}-${l.amount}-logs_row_${idx}`} />
							))
						)}
					</div>
				</TableBody>
			</Table>
		</>
	);
}
