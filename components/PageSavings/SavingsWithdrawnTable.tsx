import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsWithdrawQuery } from "@deuro/api";
import SavingsWithdrawnRow from "./SavingsWithdrawnRow";
import { Address, parseEther } from "viem";

export default function SavingsWithdrawnTable() {
	const headers: string[] = ["Date", "Saver", "Amount", "Rate", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { withdraw } = useSelector((state: RootState) => state.savings.savingsAllUserTable);
	if (!withdraw) return null;

	const sorted: SavingsWithdrawQuery[] = withdraw;

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
					<TableRowEmpty>{"There are no withdrawals yet."}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsWithdrawnRow headers={headers} key={r.id} item={r} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}
