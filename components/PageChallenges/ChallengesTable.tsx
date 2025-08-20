import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import ChallengesRow from "./ChallengesRow";
import { useState } from "react";
import {
	ChallengesId,
	ChallengesPricesMapping,
	ChallengesQueryItem,
	PositionQuery,
	PositionsQueryObjectArray,
	PriceQueryObjectArray,
} from "@deuro/api";
import { Address, formatUnits } from "viem";
import { useTranslation } from "next-i18next";

export default function ChallengesTable() {
	const { t } = useTranslation();
	const headers: string[] = [t("challenges.available"), t("challenges.price"), t("challenges.phase"), t("challenges.ends_in")];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const challenges = useSelector((state: RootState) => state.challenges.list?.list || []);
	const positions = useSelector((state: RootState) => state.positions.mapping?.map || {});
	const prices = useSelector((state: RootState) => state.prices.coingecko || {});
	const auction = useSelector((state: RootState) => state.challenges.challengesPrices?.map || {});

	const matchingChallenges = (challenges || []).filter((c) => {
		// DEV: For displaying "Inactive" challenges
		// const DIFFINMS: number = 1000 * 60 * 60 * 24 * 3; // show e.g. last 10days
		// const matching: boolean = Date.now() - parseInt(c.start.toString()) * 1000 < DIFFINMS;
		return c.status == "Active";
	});

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
			if (e === headers[1]) setReverse(true);
			else if (e === headers[2]) setReverse(true);
			else setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol headerClassNames={["text-center"]} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{t("challenges.no_active_challenges")}</TableRowEmpty>
				) : (
					sorted.map((c) => <ChallengesRow key={c.id} headers={headers} challenge={c} tab={tab} />)
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
		// Available challenge size
		challenges.sort((a, b) => {
			const calc = function (c: ChallengesQueryItem) {
				const pos: PositionQuery = positions[c.position.toLowerCase() as Address];
				const size: number = parseFloat(formatUnits(c.size, pos.collateralDecimals));
				const price: number = prices[pos.collateral.toLowerCase() as Address]?.price?.eur || 1;
				return size * price;
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
		// Phases, [Fixed Price, Declining Phase, Zero Price]
		// FIXME: unchanged sorting, add feature if needed
	} else if (tab === headers[3]) {
		// Ends in
		// FIXME: unchanged sorting, add feature if needed
	}

	return reverse ? challenges.reverse() : challenges;
}
