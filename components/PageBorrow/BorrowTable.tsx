import BorrowRow from "./BorrowRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQueryV2, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, parseEther } from "viem";
import { useEffect, useState } from "react";
import { POSITION_BLACKLISTED } from "../../app.config";

export default function BorrowTable() {
	const headers: string[] = ["Collateral", "Loan-to-Value", "Effective Interest", "Liquidation Price", "Max. Maturity"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQueryV2[]>([]);

	const { openPositions } = useSelector((state: RootState) => state.positions);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const posV2: PositionQueryV2[] = openPositions.filter((p) => p.version == 2);

	const matchingPositions: PositionQueryV2[] = posV2.filter((position) => {
		const pid: Address = position.position.toLowerCase() as Address;
		const now = Date.now();
		if (POSITION_BLACKLISTED(pid)) {
			return false;
		} else if (position.closed || position.denied) {
			return false;
		} else if (position.start * 1000 < now && position.cooldown * 1000 > now) {
			return false; // under cooldown but active position
		} else if (BigInt(position.isOriginal ? position.availableForClones : position.availableForMinting) == 0n) {
			return false;
		} else if ((challengesPosMap[pid] || []).filter((c) => c.status == "Active").length > 0) {
			return false; // active challenges
		} else {
			return true;
		}
	});

	const sortedByCollateral: { [key: Address]: PositionQueryV2[] } = {};
	matchingPositions.forEach((pos) => {
		const coll = pos.collateral.toLowerCase() as Address;
		if (sortedByCollateral[coll] == undefined) sortedByCollateral[coll] = [];
		sortedByCollateral[coll].push(pos);
	});

	const uniqueByCollateral: { [key: Address]: PositionQueryV2[] } = {};
	Object.keys(sortedByCollateral).forEach((coll) => {
		uniqueByCollateral[coll as Address] = [];
		const items = sortedByCollateral[coll as Address];

		// price
		items.forEach((i) => {
			const u = uniqueByCollateral[coll as Address];
			if (u.at(0) == undefined) uniqueByCollateral[coll as Address].push(i);
			else if (BigInt(i.price) > BigInt(u.at(0)?.price ?? 0n)) {
				uniqueByCollateral[coll as Address][0] = i;
			}
		});

		// interest
		items.forEach((i) => {
			const u = uniqueByCollateral[coll as Address];
			const c1 = (BigInt(i.annualInterestPPM) * parseEther("1")) / (BigInt(1_000_000) - BigInt(i.reserveContribution));
			const c2 =
				(BigInt(u.at(1)?.annualInterestPPM ?? "0") * parseEther("1")) /
				(BigInt(1_000_000) - BigInt(u.at(1)?.reserveContribution ?? "0"));

			if (c1 < c2 || u.at(1) == undefined) {
				uniqueByCollateral[coll as Address][1] = i;
			}
		});

		// expiration
		items.forEach((i) => {
			const u = uniqueByCollateral[coll as Address];

			if (i.expiration > (u.at(2)?.expiration ?? 0)) {
				uniqueByCollateral[coll as Address][2] = i;
			}
		});
	});

	const uniquePositions: PositionQueryV2[] = Object.values(uniqueByCollateral)
		.flat()
		.reduce<PositionQueryV2[]>((a, b) => {
			const uids = a.map((i) => i.position);
			return uids.includes(b.position) ? a : [...a, b];
		}, []);

	const sorted: PositionQueryV2[] = sortPositions(uniquePositions, coingecko, headers, tab, reverse);

	useEffect(() => {
		const idList = list.map((l) => l.position).join("_");
		const idSorted = sorted.map((l) => l.position).join("_");
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
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					list.map((pos, idx) => (
						<BorrowRow headers={headers} tab={tab} position={pos} key={`BorrowRow_${pos.position || idx}`} />
					))
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQueryV2[],
	prices: PriceQueryObjectArray,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQueryV2[] {
	const sorting = [...list];

	if (tab === headers[0]) {
		// sort for Collateral
		sorting.sort((a, b) => a.collateralSymbol.localeCompare(b.collateralSymbol)); // default: increase
	} else if (tab === headers[1]) {
		// sort for LTV, LTV = liquidation price * (1 - reserve) / market price
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const reserve: number = p.reserveContribution / 1000000;
				const price: number = prices[p.collateral.toLowerCase() as Address].price.chf || 1;
				return (liqPrice * (1 - reserve)) / price;
			};
			return calc(b) - calc(a); // default: decrease
		});
	} else if (tab === headers[2]) {
		// sort for Interest, effI = interest / (1 - reserve)
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const r: number = p.reserveContribution / 1000000;
				const i: number = p.annualInterestPPM / 1000000;
				return (i / (1 - r)) * 1000000;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sort for liq price
		sorting.sort((a, b) => parseInt(b.price) - parseInt(a.price)); // default: decrease
	} else if (tab === headers[4]) {
		// sort for Maturity
		sorting.sort((a, b) => b.expiration - a.expiration); // default: decrease
	}

	return reverse ? sorting.reverse() : sorting;
}
