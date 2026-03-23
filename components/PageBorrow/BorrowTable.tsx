import BorrowRow from "./BorrowRow";
import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQueryV2, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, normalizeAddress } from "@utils";
import { useBorrowPositions, useSwapVCHFStats } from "@hooks";

const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function BorrowTable() {
	const headers: string[] = ["Collateral", "LTV", "Interest", "Maturity"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQueryV2[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState<boolean>(true);

	const { address: walletAddress } = useAccount();
	const vchfBridge = useSwapVCHFStats();
	const { uniqueByCollateral } = useBorrowPositions();

	const { coingecko } = useSelector((state: RootState) => state.prices);

	const uniquePositions: PositionQueryV2[] = Object.values(uniqueByCollateral);

	const VCHF_Address: Address = normalizeAddress("0x79d4f0232A66c4c91b89c76362016A1707CFBF4f");
	const VCHF_Price: number = coingecko[VCHF_Address].price.chf || 0;
	const VCHF_Available: bigint = vchfBridge.bridgeLimit - vchfBridge.otherBridgeBal;
	const VCHF_Bridge: PositionQueryV2 = {
		version: 2,
		position: "0x3b71ba73299f925a837836160c3e1fec74340403",
		owner: zeroAddress,
		zchf: "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
		collateral: VCHF_Address,
		price: String(VCHF_Price * 10 ** 18),
		created: 0,
		isOriginal: true,
		isClone: false,
		denied: false,
		closed: false,
		original: "0x3b71ba73299f925a837836160c3e1fec74340403",
		parent: "0x3b71ba73299f925a837836160c3e1fec74340403",
		minimumCollateral: "0",
		annualInterestPPM: 0,
		riskPremiumPPM: 0,
		reserveContribution: 0,
		start: 0,
		cooldown: 0,
		expiration: 1776276731,
		challengePeriod: 0,
		zchfName: "Frankencoin",
		zchfSymbol: "ZCHF",
		zchfDecimals: 18,
		collateralName: "VNX Franc",
		collateralSymbol: "VCHF",
		collateralDecimals: 18,
		collateralBalance: String(vchfBridge.otherBridgeBal),
		limitForPosition: "0",
		limitForClones: String(vchfBridge.bridgeLimit),
		availableForClones: String(VCHF_Available),
		availableForMinting: String(VCHF_Available),
		availableForPosition: String(VCHF_Available),
		minted: String(vchfBridge.otherBridgeBal),
	};

	const sorted: PositionQueryV2[] = sortPositions([...uniquePositions, VCHF_Bridge], coingecko, headers, tab, reverse);

	// Wallet balance detection for "In my wallet" toggle
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
			const addr = normalizeAddress(pos.collateral);
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!pos.collateralName.toLowerCase().includes(q) && !pos.collateralSymbol.toLowerCase().includes(q)) return false;
			}
			if (activeCategories.length > 0 && !collateralMatchesCategories(addr, activeCategories as CollateralCategory[])) return false;
			if (inMyWallet && walletAddress && (walletBalanceMap[addr] ?? 0n) === 0n) return false;
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
			setReverse(false);
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
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					list.map((pos, idx) => (
						<BorrowRow
							headers={headers}
							tab={tab}
							position={pos}
							vchfBridge={vchfBridge}
							hideMyWallet={!walletAddress}
							walletBalance={walletBalanceMap}
							key={`BorrowRow_${pos.position || idx}`}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

function sortPositions(
	list: PositionQueryV2[],
	prices: PriceQueryObjectArray,
	headers: string[],
	tab: string,
	reverse: boolean
): PositionQueryV2[] {
	const sorting = [...list];

	if (tab === headers[0]) {
		// sort for Collateral
		sorting.sort((a, b) => a.collateralSymbol.localeCompare(b.collateralSymbol)); // default: increase
	} else if (tab === headers[1]) {
		// sort for LTV, LTV = liquidation price * (1 - reserve) / market price
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const reserve: number = p.reserveContribution / 1000000;
				const price: number = prices[p.collateral.toLowerCase() as Address].price.chf || 1;
				return (liqPrice * (1 - reserve)) / price;
			};
			return calc(b) - calc(a); // default: decrease
		});
	} else if (tab === headers[2]) {
		// sort for Interest, effI = interest / (1 - reserve)
		sorting.sort((a, b) => {
			const calc = function (p: PositionQueryV2) {
				const r: number = p.reserveContribution / 1000000;
				const i: number = p.annualInterestPPM / 1000000;
				return (i / (1 - r)) * 1000000;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[3]) {
		// sort for maturity
		sorting.sort((a, b) => b.expiration - a.expiration); // default: decrease
	}

	return reverse ? sorting.reverse() : sorting;
}
