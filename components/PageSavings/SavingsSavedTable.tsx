import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsSavedQuery } from "@frankencoin/api";
import SavingsSavedRow from "./SavingsSavedRow";

export default function GovernanceLeadrateTable() {
	const headers: string[] = ["Date", "Saver", "Amount", "Rate", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { save } = useSelector((state: RootState) => state.savings.savingsAllUserTable);
	if (!save) return null;

	const sorted: SavingsSavedQuery[] = save;

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
				{sorted.length == 0 ? (
					<TableRowEmpty>{"There are no savings yet."}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsSavedRow headers={headers} key={r.id} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}
