import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { MinterQuery } from "@deuro/api";
import { useState } from "react";
import GovernanceMintersRow from "./GovernanceMintersRow";
import { useTranslation } from "next-i18next";

export default function GovernanceMintersTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("governance.date"), t("governance.minter"), t("governance.comment"), t("governance.state")];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const minters = useSelector((state: RootState) => state.ecosystem.stablecoinMinters.list);
	if (!minters) return null;

	const sorted: MinterQuery[] = sortMinters({
		// @dev: somehow it does not transfer a "true array" and causes issues in sorting function
		minters: [...minters],
		headers,
		tab,
		reverse,
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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={['text-center']} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{t("governance.minters_table_empty")}</TableRowEmpty>
				) : (
					sorted.map((m) => <GovernanceMintersRow key={m.id} headers={headers} minter={m} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortMinters = {
	minters: MinterQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

enum MinterState {
	Vetoed,
	Passed,
	Pending,
}

function sortMinters(params: SortMinters): MinterQuery[] {
	const { minters, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		minters.sort((a, b) => b.applyDate - a.applyDate);
	} else if (tab === headers[1]) {
		minters.sort((a, b) => a.minter.localeCompare(b.minter));
	} else if (tab === headers[2]) {
		minters.sort((a, b) => a.applyMessage.localeCompare(b.applyMessage));
	} else if (tab === headers[3]) {
		minters.sort((a, b) => {
			const calc = function (m: MinterQuery): number {
				const vetoUntil = (m.applyDate + m.applicationPeriod) * 1000;
				const passed: boolean = Date.now() > vetoUntil;
				const vetoed: boolean = m.vetor ? true : false;

				if (vetoed) return MinterState.Vetoed;
				else if (!passed) return MinterState.Pending;
				else return MinterState.Passed;
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? minters.reverse() : minters;
}
