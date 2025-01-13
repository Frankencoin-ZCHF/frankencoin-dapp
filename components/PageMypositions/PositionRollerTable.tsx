import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useState } from "react";
import PositionRollerRow from "./PositionRollerRow";

type PositionRollerTableParams = {
	position: PositionQuery;
};

export default function PositionRollerTable(params: PositionRollerTableParams) {
	const { position } = params;

	const headers: string[] = ["Position", "Liquidation Price", "Annual Interest", "Maturity"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const matchingPositions = positions.filter((p) => {
		const toCheck: boolean[] = [];
		toCheck.push(p.version == 2);
		toCheck.push(p.collateral.toLowerCase() == position.collateral.toLowerCase());
		toCheck.push(p.expiration >= position.expiration);
		toCheck.push(BigInt(p.availableForClones) > 0n);
		return !toCheck.includes(false);
	});

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
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{"No open positions available for rolling."}</TableRowEmpty>
				) : (
					sorted.map((pos) => (
						<PositionRollerRow headers={headers} tab={tab} positionToRoll={position} position={pos} key={pos.position} />
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
		// sort position address
		positions.sort((a, b) => a.position.localeCompare(b.position));
	} else if (tab === headers[1]) {
		// sort for liq. price
		positions.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				return liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for interest
		positions.sort((a, b) => {
			return b.annualInterestPPM - a.annualInterestPPM;
		});
	} else if (tab === headers[3]) {
		// sort for maturity
		positions.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	}

	return reverse ? positions.reverse() : positions;
}
