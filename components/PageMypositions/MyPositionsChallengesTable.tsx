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
} from "@frankencoin/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function MyPositionsChallengesTable() {
	const headers: string[] = ["Size", "Averted", "Proceeds", "Succeeded", "Rewards"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<ChallengesQueryItem[]>([]);

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
					<TableRowEmpty>{"You do not have any challenges yet."}</TableRowEmpty>
				) : (
					list.map((c) => <MyPositionsChallengesRow headers={headers} tab={tab} key={c.id} challenge={c} />)
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
		// challenge size
		challenges.sort((a, b) => {
			const calc = function (c: ChallengesQueryItem) {
				const pos: PositionQuery = positions[c.position.toLowerCase() as Address];
				const size: number = parseFloat(formatUnits(c.size, pos.collateralDecimals));
				return size;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[2]) {
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[3]) {
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[4]) {
		// FIXME: unchanged sorting, add feature if needed
	}

	return reverse ? challenges.reverse() : challenges;
}
