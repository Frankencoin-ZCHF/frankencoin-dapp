import PositionRow from "./BorrowRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesQueryItem, PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { Address, formatUnits } from "viem";
import { useState } from "react";
import { POSITION_NOT_BLACKLISTED } from "../../app.config";

export default function BorrowTable() {
	const headers: string[] = ["Collateral", "Loan-to-Value", "Interest", "Available", "Maturity"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);
	const openPositions: PositionQuery[] = openPositionsByCollateral.flat(1);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const matchingPositions: PositionQuery[] = openPositions.filter((position) => {
		const pid: Address = position.position.toLowerCase() as Address;
		const considerBlackList: boolean = POSITION_NOT_BLACKLISTED(pid);
		const considerOpen: boolean = !position.closed && !position.denied;
		const considerProposed: boolean = position.start * 1000 < Date.now();
		const considerAvailableForClones: boolean = BigInt(position.availableForClones) > 0n;

		const challengesPosition = challengesPosMap[pid] || [];
		const challengesActive: ChallengesQueryItem[] = challengesPosition.filter((c) => c.status == "Active");
		const considerNoChallenges: boolean = challengesActive.length == 0;

		const verifyable: boolean[] = [considerBlackList, considerOpen, considerProposed, considerAvailableForClones, considerNoChallenges];

		return !verifyable.includes(false);
	});

	const sorted: PositionQuery[] = sortPositions(matchingPositions, coingecko, headers, tab, reverse);

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
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					sorted.map((pos) => <PositionRow headers={headers} position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQuery[],
	prices: PriceQueryObjectArray,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQuery[] {
	if (tab === headers[0]) {
		// sort for Collateral
		list.sort((a, b) => a.collateralSymbol.localeCompare(b.collateralName)); // default: increase
	} else if (tab === headers[1]) {
		// sort for LTV, LTV = liquidation price * (1 - reserve) / market price
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const reserve: number = p.reserveContribution / 1000000;
				const price: number = prices[p.collateral.toLowerCase() as Address].price.eur || 1;
				return (liqPrice * (1 - reserve)) / price;
			};
			return calc(b) - calc(a); // default: decrease
		});
	} else if (tab === headers[2]) {
		// sort for Interest, effI = interest / (1 - reserve)
		list.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const r: number = p.reserveContribution / 1000000;
				const i: number = p.annualInterestPPM / 1000000;
				return (i / (1 - r)) * 1000000;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sort for Available
		list.sort((a, b) => parseInt(b.availableForClones) - parseInt(a.availableForClones)); // default: decrease
	} else if (tab === headers[4]) {
		// sort for Maturity
		list.sort((a, b) => b.expiration - a.expiration); // default: decrease
	}

	return reverse ? list.reverse() : list;
}
