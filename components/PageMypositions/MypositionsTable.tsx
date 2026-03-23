import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesPositionsMapping, PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import MypositionsRow from "./MypositionsRow";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { generateExpirationCalendar, downloadCalendarFile, generateGoogleCalendarUrl } from "../../utils/calendarGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import { ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, normalizeAddress } from "@utils";

const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function MypositionsTable() {
	const headers: string[] = ["Collateral", "Liquidation Price", "Minted", "State"];
	const subHeaders: string[] = ["Value", "Market Price", "Available", "Time Left"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQuery[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);

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

		if (p.owner.toLowerCase() !== account.toLowerCase()) continue;

		if (p.closed || p.denied) {
			if (BigInt(p.collateralBalance) < BigInt(p.minimumCollateral)) continue;
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

	const filteredList = useMemo(() => {
		return sorted.filter((pos) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!pos.collateralName.toLowerCase().includes(q) && !pos.collateralSymbol.toLowerCase().includes(q)) return false;
			}
			if (
				activeCategories.length > 0 &&
				!collateralMatchesCategories(normalizeAddress(pos.collateral), activeCategories as CollateralCategory[])
			)
				return false;
			return true;
		});
	}, [sorted, searchQuery, activeCategories]);

	useEffect(() => {
		const idList = list.map((l) => l.position).join("_");
		const idFiltered = filteredList.map((l) => l.position).join("_");
		if (idList != idFiltered) setList(filteredList);
	}, [list, filteredList]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	const handleDownloadCalendar = () => {
		if (list.length === 0) return;
		downloadCalendarFile(generateExpirationCalendar(list, account));
	};

	const handleGoogleCalendar = () => {
		const activePositions = list.filter((p) => !p.closed && !p.denied);
		if (activePositions.length === 0) return;
		// Pick the position with the soonest expiration
		const soonest = activePositions.slice().sort((a, b) => a.expiration - b.expiration)[0];
		window.open(generateGoogleCalendarUrl(soonest), "_blank");
	};

	return (
		<>
			<Table>
				<TableHeadSearchable
					headers={headers}
					subHeaders={subHeaders}
					tab={tab}
					reverse={reverse}
					tabOnChange={handleTabOnChange}
					actionCol
					searchPlaceholder="Search Positions"
					searchValue={searchQuery}
					onSearchChange={setSearchQuery}
					hideMyWallet
					inMyWallet={false}
					onInMyWalletChange={() => {}}
					filterOptions={FILTER_OPTIONS}
					activeFilters={activeCategories}
					onFiltersChange={setActiveCategories}
				/>
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
			{list.length > 0 && (
				<div className="mb-4 flex justify-end gap-2">
					<button
						onClick={handleGoogleCalendar}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
						title="Add expiration reminder to Google Calendar"
					>
						<FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
						Add to Google Calendar
					</button>
					<button
						onClick={handleDownloadCalendar}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
						title="Download expiration alerts calendar"
					>
						<FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
						Download Calendar
					</button>
				</div>
			)}
		</>
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
