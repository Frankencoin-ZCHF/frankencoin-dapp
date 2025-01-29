import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import { useAccount } from "wagmi";
import { Address, formatUnits, zeroAddress } from "viem";
import { BidsQueryItem, ChallengesQueryItemMapping, PositionQuery, PositionsQueryObjectArray } from "@deuro/api";
import { useState } from "react";
import { useRouter } from "next/router";
import MyPositionsBidsRow from "./MyPositionsBidsRow";

export default function MyPositionsBidsTable() {
	const headers: string[] = ["Filled Size", "Price", "Bid Amount", "State"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const bids = useSelector((state: RootState) => state.bids.list.list);
	const challenges = useSelector((state: RootState) => state.challenges.mapping.map);
	const positions = useSelector((state: RootState) => state.positions.mapping.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const auction = useSelector((state: RootState) => state.challenges.challengesPrices.map);

	const router = useRouter();
	const overwrite = router.query.address as Address;

	const { address } = useAccount();
	const account = overwrite || address || zeroAddress;

	const matchingBids = bids.filter((b) => b.bidder.toLowerCase() === account.toLowerCase());

	const sorted: BidsQueryItem[] = sortBids({
		bids: matchingBids,
		challenges,
		positions,
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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={["text-center"]} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{"You do not have any bids yet."}</TableRowEmpty>
				) : (
					sorted.map((b) => <MyPositionsBidsRow key={b.id} headers={headers} bid={b} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortBids = {
	bids: BidsQueryItem[];
	challenges: ChallengesQueryItemMapping;
	positions: PositionsQueryObjectArray;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortBids(params: SortBids): BidsQueryItem[] {
	const { bids, challenges, positions, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		// Filled Size
		bids.sort((a, b) => {
			const calc = function (b: BidsQueryItem) {
				const pos: PositionQuery = positions[b.position.toLowerCase() as Address];
				const size: number = parseFloat(formatUnits(b.filledSize, pos.collateralDecimals));
				const price: number = parseFloat(formatUnits(b.price, 36 - pos.collateralDecimals));
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// Price
		bids.sort((a, b) => {
			const calc = function (b: BidsQueryItem) {
				const pos: PositionQuery = positions[b.position.toLowerCase() as Address];
				return parseFloat(formatUnits(b.price, 36 - pos.collateralDecimals));
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// Bid Amount
		bids.sort((a, b) => {
			const calc = function (b: BidsQueryItem) {
				return parseFloat(formatUnits(b.bid, 18));
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// Type
		bids.sort((a, b) => a.bidType.localeCompare(b.bidType));
	}

	return reverse ? bids.reverse() : bids;
}
