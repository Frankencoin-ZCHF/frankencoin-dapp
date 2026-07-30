import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import ChallengesRow from "./ChallengesRow";
import ForceSellRow from "./ForceSellRow";
import { useEffect, useState } from "react";
import {
	ChallengesId,
	ChallengesPricesMapping,
	ChallengesQueryItem,
	PositionQuery,
	PositionsQueryObjectArray,
	PriceQueryObjectArray,
} from "@frankencoin/api";
import { formatUnits } from "viem";
import { normalizeAddress } from "../../utils/format";
import { getForceSellPrice, isForceSellable } from "../../utils/forceSell";

type AuctionListItem =
	| { kind: "challenge"; id: string; challenge: ChallengesQueryItem }
	| { kind: "forcesell"; id: string; position: PositionQuery };

export default function ChallengesTable() {
	const headers: string[] = ["Available", "Price", "Phase", "Ends in"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<AuctionListItem[]>([]);

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const positions = useSelector((state: RootState) => state.positions.mapping.map);
	const openPositions = useSelector((state: RootState) => state.positions.openPositions);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const auction = useSelector((state: RootState) => state.challenges.challengesPrices.map);

	const matchingChallenges = challenges.filter((c) => {
		// DEV: For displaying "Inactive" challenges
		// const DIFFINMS: number = 1000 * 60 * 60 * 24 * 3; // show e.g. last 10days
		// const matching: boolean = Date.now() - parseInt(c.start.toString()) * 1000 < DIFFINMS;
		return c.status == "Active";
	});

	// Expired positions are auctioned off "silently" via forceSell (no challenge/event involved).
	const forceSellPositions = openPositions.filter((p) => isForceSellable(p));

	const combined: AuctionListItem[] = [
		...matchingChallenges.map((c) => ({ kind: "challenge" as const, id: c.id, challenge: c })),
		...forceSellPositions.map((p) => ({
			kind: "forcesell" as const,
			id: `${normalizeAddress(p.position)}-forcesell`,
			position: p,
		})),
	];

	const sorted: AuctionListItem[] = sortAuctionItems({
		items: combined,
		positions,
		prices,
		auction,
		headers,
		tab,
		reverse,
	});

	useEffect(() => {
		const idList = list.map((l) => l.id).join("_");
		const idSorted = sorted.map((l) => l.id).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no active auctions."}</TableRowEmpty>
				) : (
					list.map((item) =>
						item.kind === "challenge" ? (
							<ChallengesRow key={item.id} headers={headers} tab={tab} challenge={item.challenge} />
						) : (
							<ForceSellRow key={item.id} headers={headers} tab={tab} position={item.position} />
						)
					)
				)}
			</TableBody>
		</Table>
	);
}

type SortAuctionItems = {
	items: AuctionListItem[];
	positions: PositionsQueryObjectArray;
	prices: PriceQueryObjectArray;
	auction: ChallengesPricesMapping;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function getAvailableChf(item: AuctionListItem, positions: PositionsQueryObjectArray, prices: PriceQueryObjectArray): number {
	if (item.kind === "challenge") {
		const pos: PositionQuery = positions[normalizeAddress(item.challenge.position)];
		const size: number = parseFloat(formatUnits(item.challenge.size, pos.collateralDecimals));
		const price: number = prices[normalizeAddress(pos.collateral)]?.price.chf || 1;
		return size * price;
	} else {
		const pos = item.position;
		const size: number = parseFloat(formatUnits(BigInt(pos.collateralBalance), pos.collateralDecimals));
		const price: number = prices[normalizeAddress(pos.collateral)]?.price.chf || 1;
		return size * price;
	}
}

function getPriceChf(item: AuctionListItem, positions: PositionsQueryObjectArray, auction: ChallengesPricesMapping): number {
	if (item.kind === "challenge") {
		const pos: PositionQuery = positions[normalizeAddress(item.challenge.position)];
		const raw: bigint = BigInt(auction[item.challenge.id as ChallengesId] ?? 0);
		return parseFloat(formatUnits(raw, 36 - pos.collateralDecimals)) || 0;
	} else {
		const pos = item.position;
		const raw: bigint = getForceSellPrice(pos);
		return parseFloat(formatUnits(raw, 36 - pos.collateralDecimals)) || 0;
	}
}

function sortAuctionItems(params: SortAuctionItems): AuctionListItem[] {
	const { items, positions, prices, auction, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		// Available auction size
		items.sort((a, b) => getAvailableChf(b, positions, prices) - getAvailableChf(a, positions, prices));
	} else if (tab === headers[1]) {
		// Prices, auction prices
		items.sort((a, b) => getPriceChf(b, positions, auction) - getPriceChf(a, positions, auction));
	} else if (tab === headers[2]) {
		// Phases, [Fixed Price, Declining Phase, Zero Price]
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[3]) {
		// Ends in
		// FIXME: unchanged sorting, add feature if needed
	}

	return reverse ? items.reverse() : items;
}
