import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesPositionsMapping, PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useRouter } from "next/router";

export default function GovernancePositionsTable() {
	const headers: string[] = ["Type", "Initial Collateral", "Limit", "Interest", "Maturity", "Reserve", "State"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.positions.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const matchingPositions: PositionQuery[] = positions.filter((p) => p.start * 1000 > Date.now());

	// const sorted: PositionQuery[] = sortPositions({
	// 	positions: matchingPositions,
	// 	challenges,
	// 	prices,
	// 	headers,
	// 	tab,
	// 	reverse,
	// });

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			// if (e === headers[1]) setReverse(true);
			// else setReverse(false);

			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader
				headers={headers}
				subHeaders={["", "Initial LTV", "Liq. Price", "", "Auction Duration", "", ""]}
				tab={tab}
				reverse={reverse}
				tabOnChange={handleTabOnChange}
				actionCol
			/>
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no positions proposals"}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <TableRowEmpty key={pos.position}>{pos.position}</TableRowEmpty>)
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
				const price: number = prices[p.collateral.toLowerCase() as Address].price.chf || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for coll.
		positions.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[p.collateral.toLowerCase() as Address].price.chf || 1;
				return price / liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for minted
		positions.sort((a, b) => {
			return parseInt(b.minted) - parseInt(a.minted);
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
