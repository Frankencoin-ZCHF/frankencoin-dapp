import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { LeadrateProposed } from "@deuro/api";
import GovernanceLeadrateRow from "./GovernanceLeadrateRow";
import { useTranslation } from "next-i18next";

export default function GovernanceLeadrateTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("governance.date"), t("governance.proposer"), t("governance.rate"), t("governance.state")];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);

	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const proposals = useSelector((state: RootState) => state.savings.leadrateProposed);
	const rates = useSelector((state: RootState) => state.savings.leadrateRate);
	if (!info || !proposals || !rates) return null;

	const currentProposal = proposals.list.length > 0 ? proposals.list[0] : undefined;
	const sorted: LeadrateProposed[] = proposals.list.slice(0, 5);

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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{t("governance.proposals_table_empty")}</TableRowEmpty>
				) : (
					sorted.map((p, idx) => (
						<GovernanceLeadrateRow
							headers={headers}
							key={p.id}
							info={info}
							proposal={p}
							currentProposal={currentProposal?.id == p.id}
							tab={tab}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}
