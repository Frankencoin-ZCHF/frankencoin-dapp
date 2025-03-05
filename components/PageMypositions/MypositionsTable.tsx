import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesPositionsMapping, PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import MypositionsRow from "./MypositionsRow";
import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export default function MypositionsTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("my_positions.collateral"), t("my_positions.liquidation_price"), t("my_positions.minted"), t("my_positions.state")];
	const subHeaders: string[] = [t("my_positions.value"), t("my_positions.market_price"), t("my_positions.available"), t("my_positions.time_left")];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

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
			<TableHeader headers={headers} subHeaders={subHeaders} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={["pl-10"]} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{t("my_positions.no_positions")}</TableRowEmpty>
				) : (
					sorted.map((pos) => <MypositionsRow headers={headers} subHeaders={subHeaders} position={pos} key={pos.position} tab={tab} />)
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
	Expired,
	Expiring,
	Challenged,
}

function sortPositions(params: SortPositions): PositionQuery[] {
	const { positions, challenges, prices, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		// sort for Collateral Value
		positions.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for coll.
		positions.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return price / liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for minted
		positions.sort((a, b) => {
			return parseInt(b.principal) - parseInt(a.principal);
		});
	} else if (tab === headers[3]) {
		// sort for state
		positions.sort((a, b) => {
			const calc = function (p: PositionQuery): number {
				const pid: Address = p.position.toLowerCase() as Address;
				const cPos = challenges[pid] ?? [];
				const cPosActive = cPos.filter((c) => c.status == "Active") ?? [];
				const maturity: number = Math.round((p.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);

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

	return reverse ? positions.reverse() : positions;
}
