import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits } from "viem";
import { useEffect, useState } from "react";
import PositionRollerRow from "./PositionRollerRow";

type PositionRollerTableParams = {
	position: PositionQuery;
	challengeSize: bigint;
};

export default function PositionRollerTable(params: PositionRollerTableParams) {
	const { position } = params;

	const headers: string[] = ["Position", "Liquidation Price", "Annual Interest", "Maturity"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQuery[]>([]);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const matchingPositions = positions.filter((p) => {
		const pid: Address = p.position.toLowerCase() as Address;
		const isChallenged: boolean = (challengesPosMap[pid] || []).filter((c) => c.status == "Active").length > 0;
		return (
			p.version == 2 &&
			p.collateral.toLowerCase() == position.collateral.toLowerCase() &&
			p.expiration > position.expiration && // also excludes same position
			!p.closed &&
			!p.denied &&
			BigInt(p.availableForClones) > BigInt(position.minted) &&
			!isChallenged
		);
	});

	const sorted: PositionQuery[] = sortPositions({
		positions: matchingPositions,
		prices,
		headers,
		tab,
		reverse,
	});

	useEffect(() => {
		const idList = list.map((l) => l.position).join("_");
		const idSorted = sorted.map((l) => l.position).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{"No open positions available for rolling."}</TableRowEmpty>
				) : (
					list.map((pos) => <PositionRollerRow headers={headers} tab={tab} source={position} target={pos} key={pos.position} />)
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
	let sortingList = [...positions]; // make it writeable

	if (tab === headers[0]) {
		// sort position address
		sortingList.sort((a, b) => a.position.localeCompare(b.position));
	} else if (tab === headers[1]) {
		// sort for liq. price
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				return liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for interest
		sortingList.sort((a, b) => {
			return b.annualInterestPPM - a.annualInterestPPM;
		});
	} else if (tab === headers[3]) {
		// sort for maturity
		sortingList.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
