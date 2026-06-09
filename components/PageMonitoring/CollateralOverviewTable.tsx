import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useConnection, useReadContracts } from "wagmi";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
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
import { useSwapCHFAUStats, CollateralOverviewStat } from "@hooks";
import { useRouter } from "next/navigation";

const headers = ["Collateral", "Total Minted", "Available", "Avg Health"];
const subHeaders = ["", "Total Debt", "Usable", "Risk Health"];
const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

export default function CollateralOverviewTable() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState(false);
	const [tab, setTab] = useState(headers[1]);
	const [reverse, setReverse] = useState(false);

	const router = useRouter();
	const { address: walletAddress } = useConnection();
	const { list, openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);
	const chfauBridge = useSwapCHFAUStats();

	const positionStats = useMemo(
		() => calcOverviewStats(openPositionsByCollateral, list.list, coingecko),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[openPositionsByCollateral, list.list, coingecko]
	);

	const stats = useMemo(
		() => [...positionStats, chfauBridge.asCollateralOverview] as CollateralOverviewStat[],
		[positionStats, chfauBridge.asCollateralOverview]
	);

	const bridgeSwapUrls: Record<string, string> = {
		[normalizeAddress(chfauBridge.bridgeAddress)]: chfauBridge.swapUrl,
	};

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
			if (tab === headers[1]) return Number(b.minted) - Number(a.minted);
			if (tab === headers[2]) return Number(b.availableForClones) - Number(a.availableForClones);
			if (tab === headers[3]) return b.avgCollateral - a.avgCollateral;
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
				subHeaders={subHeaders}
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
						const collateralAmount = formatCurrency(Number(formatUnits(stat.balance, stat.collateral.decimals)), 2, 2);
						const avgHealthPct = stat.avgCollateral * 100;
						const collColor = avgHealthPct < 110 ? "text-red-500" : avgHealthPct <= 120 ? "text-orange-400" : "text-green-500";
						const swapUrl = bridgeSwapUrls[normalizeAddress(stat.original.position)];
						const isBridge = !!swapUrl;

						const totalDebt = stat.minted - stat.reserve;
						const usable = Number(stat.availableForClones) * (1 - stat.avgReserveRatio);
						const riskHealthPct =
							stat.minted > 0n && totalDebt > 0n ? avgHealthPct * (Number(stat.minted) / Number(totalDebt)) : 0;
						const riskColor =
							riskHealthPct > 0 && riskHealthPct < 110
								? "text-red-500"
								: riskHealthPct <= 120
								? "text-orange-400"
								: "text-green-500";

						return (
							<div key={stat.original.position} onClick={isBridge ? () => router.push(swapUrl) : undefined}>
								<TableRow headers={headers} subHeaders={subHeaders} tab={tab} className={isBridge ? "cursor-pointer" : ""}>
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
												<span className="text-text-subheader text-sm text-nowrap">
													{collateralAmount} {stat.collateral.symbol} •{" "}
													{formatCurrency(stat.totalValue, 2, 2, FormatType.symbol)} ZCHF
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
													{collateralAmount} {stat.collateral.symbol} •{" "}
													{formatCurrency(stat.totalValue, 2, 2, FormatType.symbol)} ZCHF
												</span>
											</div>
										</AppBox>
									</div>

									{/* Total Minted / Total Debt */}
									<div className="flex flex-col text-right">
										<div className="text-md">
											{formatCurrency(formatUnits(stat.minted, 18), 2, 2, FormatType.symbol)} ZCHF
										</div>
										<div className="text-xs text-text-subheader">
											{stat.minted > 0n
												? `${formatCurrency(formatUnits(totalDebt, 18), 2, 2, FormatType.symbol)} ZCHF`
												: "-"}
										</div>
									</div>

									{/* Available / Usable */}
									<div className="flex flex-col text-right">
										<div className="text-md">
											{formatCurrency(Number(stat.availableForClones), 2, 2, FormatType.symbol)} ZCHF
										</div>
										<div className="text-xs text-text-subheader">
											{formatCurrency(usable, 2, 2, FormatType.symbol)} ZCHF
										</div>
									</div>

									{/* Avg Health / Risk Health */}
									<div className="flex flex-col text-right">
										<div className={`text-md font-bold ${!isBridge && stat.minted > 0n ? collColor : ""}`}>
											{stat.minted === 0n ? "-" : `${formatCurrency(avgHealthPct, 2, 2)}%`}
										</div>
										<div
											className={`text-xs font-semibold ${
												!isBridge && riskHealthPct > 0 ? riskColor : "text-text-subheader"
											}`}
										>
											{riskHealthPct > 0 ? `${formatCurrency(riskHealthPct, 2, 2)}%` : "-"}
										</div>
									</div>
								</TableRow>
							</div>
						);
					})
				)}
			</TableBody>
		</Table>
	);
}
