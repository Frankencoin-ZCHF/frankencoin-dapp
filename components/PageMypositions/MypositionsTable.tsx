import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesPositionsMapping, PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import MypositionsRow from "./MypositionsRow";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function MypositionsTable() {
	const headers: string[] = ["Collateral", "Liquidation Price", "Minted", "State"];
	const subHeaders: string[] = ["Value", "Market Price", "Available", "Time Left"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQuery[]>([]);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.positions.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const router = useRouter();
	const overwrite = router.query.address as Address;

	const { address } = useAccount();
	const account = overwrite || address || zeroAddress;

	const sortedByCollateral: { [key: Address]: PositionQuery[] } = {};
	const closedPositions: { [key: Address]: PositionQuery[] } = {};
	for (const p of positions) {
		const k: Address = p.collateral.toLowerCase() as Address;

		if (p.owner !== account) continue;

		if (p.closed || p.denied) {
			if (BigInt(p.collateralBalance) == 0n) continue;
			if (closedPositions[k] == undefined) closedPositions[k] = [];
			closedPositions[k].push(p);
			continue;
		}

		if (sortedByCollateral[k] == undefined) sortedByCollateral[k] = [];
		sortedByCollateral[k].push(p);
	}

	const flatingPositions: PositionQuery[] = Object.values(sortedByCollateral).flat(1);
	const matchingPositions: PositionQuery[] = flatingPositions.concat(Object.values(closedPositions).flat(1));

	const sorted: PositionQuery[] = sortPositions({
		positions: matchingPositions,
		challenges,
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
			<TableHeader headers={headers} subHeaders={subHeaders} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{"You do not have any positions yet."}</TableRowEmpty>
				) : (
					list.map((pos) => (
						<MypositionsRow headers={headers} subHeaders={subHeaders} tab={tab} position={pos} key={pos.position} />
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortPositions = {
	positions: PositionQuery[];
	challenges: ChallengesPositionsMapping;
	prices: PriceQueryObjectArray;
	headers: string[];
	tab: string;
	reverse: boolean;
};

enum PositionState {
	Closed,
	Open,
	Cooldown,
	New,
	Expiring,
	Challenged,
	Expired,
}

function sortPositions(params: SortPositions): PositionQuery[] {
	const { positions, challenges, prices, headers, tab, reverse } = params;
	let sortingList = [...positions]; // make it writeable

	if (tab === headers[0]) {
		// sort for Collateral Value
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.chf || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for coll.
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.chf || 1;
				return price / liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for minted
		sortingList.sort((a, b) => {
			return parseInt(b.minted) - parseInt(a.minted);
		});
	} else if (tab === headers[3]) {
		// sort first for time left
		sortingList.sort((a, b) => b.expiration - a.expiration);

		// sort for state
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery): number {
				const pid: Address = p.position.toLowerCase() as Address;
				const cPos = challenges[pid] ?? [];
				const cPosActive = cPos.filter((c) => c.status == "Active") ?? [];
				const maturity: number = (p.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

				if (p.closed || p.denied) {
					return PositionState.Closed;
				} else if (cPosActive.length > 0) {
					return PositionState.Challenged;
				} else if (p.start * 1000 > Date.now()) {
					return PositionState.New;
				} else if (p.cooldown * 1000 > Date.now()) {
					return PositionState.Cooldown;
				} else if (maturity < 7) {
					if (maturity > 0) return PositionState.Expiring;
					else return PositionState.Expired;
				} else {
					return PositionState.Open;
				}
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
