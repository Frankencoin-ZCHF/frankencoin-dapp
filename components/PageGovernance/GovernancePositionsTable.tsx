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
import GovernancePositionsRow from "./GovernancePositionsRow";

export default function GovernancePositionsTable() {
	const headers: string[] = ["Collateral", "Initial Size", "Limit", "Interest", "Maturity", "Reserve", "Time Left"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const matchingPositions: PositionQuery[] = positions.filter((p) => !p.closed && !p.denied && p.start * 1000 > Date.now());

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
				{sorted.length == 0 ? (
					<TableRowEmpty>{"If there are new positions with new parameters or a new type of collateral, they are shown here until they have passed the governance process."}</TableRowEmpty>
				) : (
					sorted.map((pos) => <GovernancePositionsRow key={pos.position} position={pos} prices={prices} />)
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
	const { positions, prices, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		positions.sort((a, b) => a.collateralName.localeCompare(b.collateralName));
	} else if (tab === headers[1]) {
		positions.sort((a, b) => parseInt(b.minimumCollateral) - parseInt(a.minimumCollateral));
	} else if (tab === headers[2]) {
		positions.sort((a, b) => parseInt(b.limitForClones) - parseInt(a.limitForClones));
	} else if (tab === headers[3]) {
		positions.sort((a, b) => b.annualInterestPPM - a.annualInterestPPM);
	} else if (tab === headers[4]) {
		positions.sort((a, b) => {
			const ma = a.expiration - a.start;
			const mb = b.expiration - b.start;
			return mb - ma;
		});
	} else if (tab === headers[5]) {
		positions.sort((a, b) => b.reserveContribution - a.reserveContribution);
	} else if (tab === headers[6]) {
		positions.sort((a, b) => {
			const ra = a.start * 1000 - Date.now();
			const rb = b.start * 1000 - Date.now();
			return rb - ra;
		});
	}

	return reverse ? positions.reverse() : positions;
}
