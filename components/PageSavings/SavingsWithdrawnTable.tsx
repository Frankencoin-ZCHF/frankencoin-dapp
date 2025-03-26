import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsWithdrawQuery } from "@deuro/api";
import SavingsWithdrawnRow from "./SavingsWithdrawnRow";
import { useTranslation } from "next-i18next";

export default function SavingsWithdrawnTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("savings.date"), t("savings.saver"), t("savings.amount"), t("savings.rate"), t("savings.balance")];
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
					<TableRowEmpty>{t("savings.no_withdrawals_yet")}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsWithdrawnRow headers={headers} key={r.id} item={r} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}
