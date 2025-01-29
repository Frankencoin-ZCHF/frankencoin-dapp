import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ApiChallengesPositions, ChallengesQueryItem, PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { Address, formatUnits } from "viem";
import MonitoringRow from "./MonitoringRow";
import { useState } from "react";

export default function MonitoringTable() {
	const headers: string[] = ["Collateral", "Collateralization", "Expiration", "Challenged"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(true);

	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);
	const matchingPositions = openPositionsByCollateral.flat();

	const sorted: PositionQuery[] = sortPositions(matchingPositions, coingecko, challenges, headers, tab, reverse);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else if (e === headers[2]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={["text-center"]} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{"There are no active positions."}</TableRowEmpty>
				) : (
					sorted.map((pos) => <MonitoringRow headers={headers} position={pos} key={pos.position} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQuery[],
	prices: PriceQueryObjectArray,
	challenges: ApiChallengesPositions,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQuery[] {
	if (tab === headers[0]) {
		// sort for Collateral Value
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for coll.
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return price / liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sorft for Expiration
		list.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	} else if (tab === headers[3]) {
		// sort for Challenged
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const cp: ChallengesQueryItem[] = challenges.map[p.position.toLowerCase() as Address] || [];
				const ca: ChallengesQueryItem[] = cp.filter((c) => c.status === "Active");
				const cs: number = ca.reduce<number>((n: number, c: ChallengesQueryItem): number => {
					const _size: number = parseFloat(formatUnits(BigInt(c.size.toString()), p.collateralDecimals));
					const _filled: number = parseFloat(formatUnits(BigInt(c.filledSize.toString()), p.collateralDecimals));
					return n + _size - _filled;
				}, 0);
				return cs / size;
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? list.reverse() : list;
}
