import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ApiChallengesPositions, ChallengesQueryItem, PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import MonitoringRow from "./MonitoringRow";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, normalizeAddress } from "@utils";

const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function MonitoringTable() {
	const headers: string[] = ["Collateral", "Collateralization", "Expiration", "Challenged"];
	const [tab, setTab] = useState<string>(headers[1]);
	const [reverse, setReverse] = useState<boolean>(true);
	const [list, setList] = useState<PositionQuery[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState<boolean>(false);

	const { address: walletAddress } = useAccount();

	const { openPositions } = useSelector((state: RootState) => state.positions);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const sorted: PositionQuery[] = sortPositions(openPositions, coingecko, challenges, headers, tab, reverse);

	const uniqueCollaterals = useMemo(
		() => [...new Set(sorted.map((p) => normalizeAddress(p.collateral)))],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sorted.map((p) => p.collateral).join(",")]
	);

	const { data: balanceResults } = useReadContracts({
		contracts: uniqueCollaterals.map((addr) => ({
			address: addr,
			abi: erc20Abi,
			functionName: "balanceOf" as const,
			args: [walletAddress ?? zeroAddress],
		})),
		query: { enabled: !!walletAddress && inMyWallet },
	});

	const walletBalanceMap = useMemo(() => {
		const map: Record<string, bigint> = {};
		uniqueCollaterals.forEach((addr, i) => {
			map[addr] = (balanceResults?.[i]?.result as bigint | undefined) ?? 0n;
		});
		return map;
	}, [uniqueCollaterals, balanceResults]);

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
			if (inMyWallet && walletAddress && (walletBalanceMap[normalizeAddress(pos.collateral)] ?? 0n) === 0n) return false;
			return true;
		});
	}, [sorted, searchQuery, activeCategories, inMyWallet, walletAddress, walletBalanceMap]);

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
			else if (e === headers[2]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeadSearchable
				headers={headers}
				tab={tab}
				reverse={reverse}
				tabOnChange={handleTabOnChange}
				actionCol
				searchPlaceholder="Search Positions"
				searchValue={searchQuery}
				onSearchChange={setSearchQuery}
				hideMyWallet={!walletAddress}
				inMyWallet={inMyWallet}
				onInMyWalletChange={setInMyWallet}
				filterOptions={FILTER_OPTIONS}
				activeFilters={activeCategories}
				onFiltersChange={setActiveCategories}
			/>
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no active positions."}</TableRowEmpty>
				) : (
					list.map((pos) => <MonitoringRow headers={headers} tab={tab} position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQuery[],
	prices: PriceQueryObjectArray,
	challenges: ApiChallengesPositions,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQuery[] {
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// sort for Collateral Value
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const price: number = prices[normalizeAddress(p.collateral)]?.price?.chf || 1;
				return size * price;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[1]) {
		// sort for coll.
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const price: number = prices[normalizeAddress(p.collateral)]?.price?.chf || 1;
				return price / liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sorft for Expiration
		sortingList.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	} else if (tab === headers[3]) {
		// sort for Challenged
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const size: number = parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				const cp: ChallengesQueryItem[] = challenges.map[normalizeAddress(p.position)] || [];
				const ca: ChallengesQueryItem[] = cp.filter((c) => c.status === "Active");
				const cs: number = ca.reduce<number>((n: number, c: ChallengesQueryItem): number => {
					const _size: number = parseFloat(formatUnits(BigInt(c.size.toString()), p.collateralDecimals));
					const _filled: number = parseFloat(formatUnits(BigInt(c.filledSize.toString()), p.collateralDecimals));
					return n + _size - _filled;
				}, 0);
				return cs / size;
			};
			return calc(b) - calc(a);
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
