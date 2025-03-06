import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { SavingsInterestQuery } from "@deuro/api";
import SavingsInterestRow from "./SavingsInterestRow";
import { useTranslation } from "next-i18next";

export default function SavingsInterestTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("savings.date"), t("savings.saver"), t("savings.interest"), t("savings.rate"), t("savings.balance")];
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
					<TableRowEmpty>{t("savings.no_interest_claims_yet")}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsInterestRow headers={headers} key={r.id} item={r} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}
