import BorrowMorphoRow from "./BorrowMorphoRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { Market } from "../../redux/slices/morpho.types";

export default function BorrowMorphoTable() {
	const headers: string[] = ["Collateral", "LLTV", "Borrow Rate", "Liquidation Price", "Liquidity"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<Market[]>([]);

	const { markets } = useSelector((state: RootState) => state.morpho);

	const sorted: Market[] = markets;

	useEffect(() => {
		const idList = list.map((l) => l.uniqueKey).join("_");
		const idSorted = sorted.map((l) => l.uniqueKey).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

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
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no morpho markets yet."}</TableRowEmpty>
				) : (
					list.map((pos, idx) => (
						<BorrowMorphoRow headers={headers} tab={tab} market={pos} key={pos.uniqueKey || `BorrowMorphoRow_${idx}`} />
					))
				)}
			</TableBody>
		</Table>
	);
}
