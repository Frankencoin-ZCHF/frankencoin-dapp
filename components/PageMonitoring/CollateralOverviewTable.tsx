import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import { RootState } from "../../redux/redux.store";
import { calcOverviewStats } from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import TableHeadSearchable from "../Table/TableHeadSearchable";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, normalizeAddress, ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, FormatType } from "@utils";
import AppBox from "@components/AppBox";
import { FilterOption } from "@components/Table/TableHeadSearchable";

const headers = ["Collateral", "Total Value", "Positions", "Total Minted", "Avg Coll. Ratio"];
const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function CollateralOverviewTable() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState(false);
	const [tab, setTab] = useState(headers[3]);
	const [reverse, setReverse] = useState(false);

	const { address: walletAddress } = useAccount();
	const { list, openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const stats = useMemo(
		() => calcOverviewStats(openPositionsByCollateral, list.list, coingecko),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[openPositionsByCollateral, list.list, coingecko]
	);

	const uniqueCollaterals = useMemo(() => stats.map((s) => normalizeAddress(s.collateral.address)), [stats]);

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

	const sorted = useMemo(() => {
		const s = [...stats].sort((a, b) => {
			if (tab === headers[0]) return a.collateral.name.localeCompare(b.collateral.name);
			if (tab === headers[1]) return b.totalValue - a.totalValue;
			if (tab === headers[2]) return b.originals.length + b.clones.length - (a.originals.length + a.clones.length);
			if (tab === headers[3]) return Number(b.minted) - Number(a.minted);
			if (tab === headers[4]) return b.avgCollateral - a.avgCollateral;
			return 0;
		});
		return reverse ? s.reverse() : s;
	}, [stats, tab, reverse]);

	const filtered = useMemo(() => {
		return sorted.filter((s) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!s.collateral.name.toLowerCase().includes(q) && !s.collateral.symbol.toLowerCase().includes(q)) return false;
			}
			if (
				activeCategories.length > 0 &&
				!collateralMatchesCategories(normalizeAddress(s.collateral.address), activeCategories as CollateralCategory[])
			)
				return false;
			if (inMyWallet && walletAddress && (walletBalanceMap[normalizeAddress(s.collateral.address)] ?? 0n) === 0n) return false;
			return true;
		});
	}, [sorted, searchQuery, activeCategories, inMyWallet, walletAddress, walletBalanceMap]);

	const handleTabChange = (header: string) => {
		if (tab === header) {
			setReverse((r) => !r);
		} else {
			setTab(header);
			setReverse(false);
		}
	};

	return (
		<Table>
			<TableHeadSearchable
				headers={headers}
				searchPlaceholder="Search collateral"
				searchValue={searchQuery}
				onSearchChange={setSearchQuery}
				hideMyWallet={!walletAddress}
				inMyWallet={inMyWallet}
				onInMyWalletChange={setInMyWallet}
				filterOptions={FILTER_OPTIONS}
				activeFilters={activeCategories}
				onFiltersChange={setActiveCategories}
				tab={tab}
				reverse={reverse}
				tabOnChange={handleTabChange}
			/>
			<TableBody>
				{filtered.length === 0 ? (
					<TableRowEmpty>No collateral found.</TableRowEmpty>
				) : (
					filtered.map((stat) => {
						const posCount = stat.originals.length + stat.clones.length;
						const balanceFormatted = formatCurrency(Number(formatUnits(stat.balance, stat.collateral.decimals)), 2, 2);
						const avgCollPct = stat.avgCollateral * 100;
						const collColor = avgCollPct < 110 ? "text-red-500" : avgCollPct <= 120 ? "text-orange-400" : "text-green-500";

						return (
							<TableRow headers={headers} tab={tab} key={stat.original.position}>
								{/* Collateral */}
								<div className="flex flex-col max-md:mb-5">
									<div className="max-md:hidden md:-ml-12 flex items-center">
										<span className="mr-4">
											<TokenLogo currency={stat.collateral.symbol.toLowerCase()} />
										</span>
										<div className="flex flex-col text-left">
											<span className="font-bold text-md max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] md:text-nowrap truncate">
												{stat.collateral.name}
											</span>
											<span className="text-text-subheader text-sm">
												{balanceFormatted} {stat.collateral.symbol}
											</span>
										</div>
									</div>

									<AppBox className="md:hidden flex flex-row items-center">
										<span className="mr-4">
											<TokenLogo currency={stat.collateral.symbol.toLowerCase()} />
										</span>
										<div className="flex flex-col text-left">
											<span className="font-bold text-md">{stat.collateral.name}</span>
											<span className="text-text-subheader text-sm">
												{balanceFormatted} {stat.collateral.symbol}
											</span>
										</div>
									</AppBox>
								</div>

								{/* Total Value */}
								<div className="text-md">{formatCurrency(stat.totalValue, 2, 2, FormatType.symbol)} ZCHF</div>

								{/* Positions */}
								<div className="text-md">{posCount}</div>

								{/* Total Minted */}
								<div className="text-md">{formatCurrency(formatUnits(stat.minted, 18), 2, 2, FormatType.symbol)} ZCHF</div>

								{/* Avg Coll. Ratio */}
								<div className={`text-md font-bold ${stat.minted > 0n ? collColor : ""}`}>
									{stat.minted > 0n ? formatCurrency(avgCollPct, 2, 2) : "- "}%
								</div>
							</TableRow>
						);
					})
				)}
			</TableBody>
		</Table>
	);
}
