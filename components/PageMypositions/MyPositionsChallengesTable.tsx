import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import MyPositionsChallengesRow from "./MyPositionsChallengesRow";
import { useAccount } from "wagmi";
import { Address, formatUnits, zeroAddress } from "viem";
import {
	ChallengesId,
	ChallengesPricesMapping,
	ChallengesQueryItem,
	PositionQuery,
	PositionsQueryObjectArray,
	PriceQueryObjectArray,
} from "@deuro/api";
import { useState } from "react";
import { useRouter } from "next/router";

export default function MyPositionsChallengesTable() {
	const headers: string[] = ["Remaining Size", "Current Price", "State", "Time Left"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const positions = useSelector((state: RootState) => state.positions.mapping.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const auction = useSelector((state: RootState) => state.challenges.challengesPrices.map);

	const router = useRouter();
	const overwrite = router.query.address as Address;

	const { address } = useAccount();
	const account = overwrite || address || zeroAddress;

	const matchingChallenges = challenges.filter((c) => c.challenger.toLowerCase() === account.toLowerCase());

	const sorted: ChallengesQueryItem[] = sortChallenges({
		challenges: matchingChallenges,
		positions,
		prices,
		auction,
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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{"You do not have any challenges yet."}</TableRowEmpty>
				) : (
					sorted.map((c) => <MyPositionsChallengesRow headers={headers} key={c.id} challenge={c} tab={tab} />)
				)}
			</TableBody>
		</Table>
	);
}

type SortChallenges = {
	challenges: ChallengesQueryItem[];
	positions: PositionsQueryObjectArray;
	prices: PriceQueryObjectArray;
	auction: ChallengesPricesMapping;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortChallenges(params: SortChallenges): ChallengesQueryItem[] {
	const { challenges, positions, prices, auction, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		// Remaining challenge size
		challenges.sort((a, b) => {
			const calc = function (c: ChallengesQueryItem) {
				const pos: PositionQuery = positions[c.position.toLowerCase() as Address];
				const size: number = parseFloat(formatUnits(c.size, pos.collateralDecimals));
				const filled: number = parseFloat(formatUnits(c.filledSize, pos.collateralDecimals));
				const price: number = prices[pos.collateral.toLowerCase() as Address].price.eur || 1;
				return (size - filled) * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// Prices, auction prices
		challenges.sort((a, b) => {
			const calc = function (c: ChallengesQueryItem) {
				const pos: PositionQuery = positions[c.position.toLowerCase() as Address];
				const raw: bigint = BigInt(auction[c.id as ChallengesId] ?? 0);
				const price: number = parseFloat(formatUnits(raw, 36 - pos.collateralDecimals)) || 0;
				return price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// Phase state
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[3]) {
		// Ends in
		// FIXME: unchanged sorting, add feature if needed
	}

	return reverse ? challenges.reverse() : challenges;
}
