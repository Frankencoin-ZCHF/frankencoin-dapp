import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsSavedQuery } from "@deuro/api";
import SavingsSavedRow from "./SavingsSavedRow";
import { useTranslation } from "next-i18next";

export default function GovernanceLeadrateTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("savings.date"), t("savings.saver"), t("savings.amount"), t("savings.rate"), t("savings.balance")];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const savingsAllUserTable = useSelector((state: RootState) => state.savings.savingsAllUserTable);
	const save = savingsAllUserTable?.save || [];
	if (!save.length) return null;

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
			<TableHeader className={sorted.length == 0 ? "!hidden" : ""} headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} headerClassNames={['text-center']} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty className={sorted.length == 0 ? "!rounded-t-lg" : ""}>{t("savings.no_savings_yet")}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsSavedRow headers={headers} key={r.id} item={r} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}
