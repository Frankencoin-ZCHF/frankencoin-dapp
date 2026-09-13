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
import { useSwapCHFAUStats, useAmplifierOverviewStats, CollateralOverviewStat } from "@hooks";
import { useRouter } from "next/navigation";
import { amplifierPageLink } from "../../utils/amplifierConstants";

const headers = ["Collateral", "Open Debt", "Avail. Debt", "Max Debt", "Locked Collateral"];
const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

/**
 * The figures each row shows, derived once so that sorting and rendering cannot drift apart.
 * `minted` and `reserve` are in wei, while the limits are already in whole ZCHF.
 */
function deriveRow(stat: CollateralOverviewStat) {
	const openDebt = Number(formatUnits(stat.minted - stat.reserve, 18));
	const availDebt = Number(stat.availableForClones) * (1 - stat.avgReserveRatio);
	const maxDebt = Number(stat.limitForClones) * (1 - stat.avgReserveRatio);

	// share of the minting capacity that is used up, respectively still free
	const openDebtPct = maxDebt > 0 ? (openDebt / maxDebt) * 100 : 0;
	const availDebtPct = maxDebt > 0 ? (availDebt / maxDebt) * 100 : 0;

	// value of the collateral backing the debt, and that value relative to the open debt
	const collValue = stat.lockedValue;
	const collValuePct = openDebt > 0 ? (collValue / openDebt) * 100 : 0;

	return { openDebt, availDebt, maxDebt, openDebtPct, availDebtPct, collValue, collValuePct };
}

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
	const amplifiers = useSelector((state: RootState) => state.amplifiers.list);
	const amplifierStats = useAmplifierOverviewStats();

	const positionStats = useMemo(
		() => calcOverviewStats(openPositionsByCollateral, list.list, coingecko),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[openPositionsByCollateral, list.list, coingecko]
	);

	const stats = useMemo(
		() => [...positionStats, chfauBridge.asCollateralOverview, ...amplifierStats] as CollateralOverviewStat[],
		[positionStats, chfauBridge.asCollateralOverview, amplifierStats]
	);

	// rows that are not MintingHub positions link to the page that operates them
	const bridgeSwapUrls: Record<string, string> = {
		[normalizeAddress(chfauBridge.bridgeAddress)]: chfauBridge.swapUrl,
		...Object.fromEntries(
			amplifiers.map((a) => [normalizeAddress(a.address), amplifierPageLink({ address: a.address, chainId: a.chainId })])
		),
	};

	// rows can live on different chains, so a collateral is identified by chain and address
	const balanceKey = (chainId: number, address: string) => `${chainId}:${normalizeAddress(address)}`;

	const uniqueCollaterals = useMemo(() => {
		const seen = new Map<string, { chainId: number; address: Address }>();
		stats.forEach((s) =>
			seen.set(balanceKey(s.collateral.chainId, s.collateral.address), {
				chainId: s.collateral.chainId,
				address: normalizeAddress(s.collateral.address),
			})
		);
		return [...seen.values()];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stats]);

	const { data: balanceResults } = useReadContracts({
		contracts: uniqueCollaterals.map(({ chainId, address }) => ({
			chainId,
			address,
			abi: erc20Abi,
			functionName: "balanceOf" as const,
			args: [walletAddress ?? zeroAddress],
		})),
		query: { enabled: !!walletAddress && inMyWallet },
	});

	const walletBalanceMap = useMemo(() => {
		const map: Record<string, bigint> = {};
		uniqueCollaterals.forEach(({ chainId, address }, i) => {
			map[balanceKey(chainId, address)] = (balanceResults?.[i]?.result as bigint | undefined) ?? 0n;
		});
		return map;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uniqueCollaterals, balanceResults]);

	const sorted = useMemo(() => {
		const s = [...stats].sort((a, b) => {
			if (tab === headers[0]) return a.collateral.name.localeCompare(b.collateral.name);
			const [da, db] = [deriveRow(a), deriveRow(b)];
			// every column sorts by the amount on its first line, not by the percentage below it
			if (tab === headers[1]) return db.openDebt - da.openDebt;
			if (tab === headers[2]) return db.availDebt - da.availDebt;
			if (tab === headers[3]) return db.maxDebt - da.maxDebt;
			if (tab === headers[4]) return db.collValue - da.collValue;
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
			if (inMyWallet && walletAddress && (walletBalanceMap[balanceKey(s.collateral.chainId, s.collateral.address)] ?? 0n) === 0n)
				return false;
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
						const collateralAmount = formatCurrency(Number(formatUnits(stat.balance, stat.collateral.decimals)), 2, 2);
						const swapUrl = bridgeSwapUrls[normalizeAddress(stat.original.position)];
						const isBridge = !!swapUrl;

						const { openDebt, availDebt, maxDebt, openDebtPct, availDebtPct, collValue, collValuePct } = deriveRow(stat);

						// a token pair is listed side by side, CHF collateral stands alone, the rest is valued in ZCHF
						const holding = `${collateralAmount} ${stat.collateral.symbol}`;
						const composition =
							stat.pairedZchfAmount !== undefined
								? `${holding} + ${formatCurrency(stat.pairedZchfAmount, 2, 2, FormatType.symbol)} ZCHF`
								: stat.omitZchfValue
								? holding
								: `${holding} • ${formatCurrency(stat.totalValue, 2, 2, FormatType.symbol)} ZCHF`;

						return (
							<div key={stat.original.position} onClick={isBridge ? () => router.push(swapUrl) : undefined}>
								<TableRow headers={headers} tab={tab} className={isBridge ? "cursor-pointer" : ""}>
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
												<span className="text-text-subheader text-sm text-nowrap">{composition}</span>
											</div>
										</div>

										<AppBox className="md:hidden flex flex-row items-center">
											<span className="mr-4">
												<TokenLogo currency={stat.collateral.symbol.toLowerCase()} />
											</span>
											<div className="flex flex-col text-left">
												<span className="font-bold text-md">{stat.collateral.name}</span>
												<span className="text-text-subheader text-sm">{composition}</span>
											</div>
										</AppBox>
									</div>

									{/* Open Debt */}
									<div className="flex flex-col text-right">
										<span>{formatCurrency(openDebt, 2, 2, FormatType.symbol)} ZCHF</span>
										<span className="text-text-subheader text-sm">
											{maxDebt > 0 ? `${formatCurrency(openDebtPct, 2, 2)}% used` : "-"}
										</span>
									</div>

									{/* Avail. Debt */}
									<div className="flex flex-col text-right">
										<span>{formatCurrency(availDebt, 2, 2, FormatType.symbol)} ZCHF</span>
										<span className="text-text-subheader text-sm">
											{maxDebt > 0 ? `${formatCurrency(availDebtPct, 2, 2)}% free` : "-"}
										</span>
									</div>

									{/* Max Debt */}
									<div className="text-right">{formatCurrency(maxDebt, 2, 2, FormatType.symbol)} ZCHF</div>

									{/* Locked Value */}
									<div className="flex flex-col text-right">
										<span>{formatCurrency(collValue, 2, 2, FormatType.symbol)} ZCHF</span>
										<span className="text-text-subheader text-sm">
											{collValuePct > 0 ? `${formatCurrency(collValuePct, 2, 2)}% of debt` : "-"}
										</span>
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
