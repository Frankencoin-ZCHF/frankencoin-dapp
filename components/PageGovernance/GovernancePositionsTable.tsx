import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { useState } from "react";
import GovernancePositionsRow from "./GovernancePositionsRow";
import { useTranslation } from "next-i18next";

export default function GovernancePositionsTable() {
	const { t } = useTranslation();
	
	const headers: string[] = [t("governance.collateral"), t("governance.position"), t("governance.limit"), t("governance.interest"), t("governance.time_left")];
	const subHeaders: string[] = ["", t("governance.owner"), t("governance.reserve"), t("governance.maturity"), t("governance.auction_duration")];
	const [tab, setTab] = useState<string>(headers[4]);
	const [reverse, setReverse] = useState<boolean>(true);

	const positions = useSelector((state: RootState) => state.positions.list?.list || []);
	const prices = useSelector((state: RootState) => state.prices.coingecko || {});


	const matchingPositions: PositionQuery[] = positions.filter((p) => !p.closed && !p.denied && p.start * 1000 > Date.now());

	const sorted: PositionQuery[] = sortPositions({
		positions: matchingPositions,
		prices,
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
			<TableHeader headers={headers} subHeaders={subHeaders} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={['text-center']} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>
						{t("governance.positions_table_empty")}
					</TableRowEmpty>
				) : (
					sorted.map((pos) => (
						<GovernancePositionsRow
							key={pos.position}
							headers={headers}
							subHeaders={subHeaders}
							position={pos}
							tab={tab}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortPositions = {
	positions: PositionQuery[];
	prices: PriceQueryObjectArray;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortPositions(params: SortPositions): PositionQuery[] {
	const { positions, prices, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		positions.sort((a, b) => a.collateralName.localeCompare(b.collateralName));
	} else if (tab === headers[1]) {
		positions.sort((a, b) => a.position.localeCompare(b.position));
	} else if (tab === headers[2]) {
		positions.sort((a, b) => parseInt(b.limitForClones) - parseInt(a.limitForClones));
	} else if (tab === headers[3]) {
		positions.sort((a, b) => b.annualInterestPPM - a.annualInterestPPM);
	} else if (tab === headers[4]) {
		positions.sort((a, b) => {
			const ra = a.start * 1000 - Date.now();
			const rb = b.start * 1000 - Date.now();
			return rb - ra;
		});
	}

	return reverse ? positions.reverse() : positions;
}
