import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsInterestQuery } from "@frankencoin/api";
import SavingsInterestRow from "./SavingsInterestRow";

export default function SavingsInterestTable() {
	const headers: string[] = ["Date", "Saver", "Interest", "Rate", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { interest } = useSelector((state: RootState) => state.savings.savingsAllUserTable);
	if (!interest) return null;

	const sorted: SavingsInterestQuery[] = interest;

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
					<TableRowEmpty>{"There are no interest claims yet."}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsInterestRow headers={headers} key={r.id} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}
