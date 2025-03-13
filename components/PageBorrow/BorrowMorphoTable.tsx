import BorrowMorphoRow from "./BorrowMorphoRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { Market } from "../../redux/slices/morpho.types";
import { formatUnits } from "viem";

export default function BorrowMorphoTable() {
	const headers: string[] = ["Collateral", "Loan-to-Value", "Current Interest", "Liquidation Price", "Liquidity"];
	const [tab, setTab] = useState<string>(headers[4]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<Market[]>([]);

	const { markets } = useSelector((state: RootState) => state.morpho);

	const sorted: Market[] = sorting(markets, headers, tab, reverse);

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

function sorting(list: Market[], headers: string[], tab: string, reverse: boolean): Market[] {
	const sorting = [...list];

	if (tab === headers[0]) {
		// sort for Collateral
		sorting.sort((a, b) => a.collateralAsset.symbol.localeCompare(b.collateralAsset.symbol)); // default: increase
	} else if (tab === headers[1]) {
		// sort for LLTV
		sorting.sort((a, b) => {
			const calc = function (p: Market) {
				return Number(formatUnits(BigInt(p.lltv), 18));
			};
			return calc(a) - calc(b); // default: decrease
		});
	} else if (tab === headers[2]) {
		// sort for borrow rate
		sorting.sort((a, b) => {
			const calc = function (p: Market) {
				return p.state.borrowApy;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sort for liq price
		sorting.sort((a, b) => {
			const calc = function (market: Market) {
				const oraclePrice = Number(formatUnits(BigInt(market.state.price), 36 - market.collateralAsset.decimals + 18));
				const liquidationPrice = oraclePrice * Number(formatUnits(BigInt(market.lltv), 18));
				return liquidationPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[4]) {
		// sort for Maturity
		sorting.sort((a, b) => {
			const calc = function (p: Market) {
				return Number(formatUnits(BigInt(p.state.liquidityAssets), 18));
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? sorting.reverse() : sorting;
}
