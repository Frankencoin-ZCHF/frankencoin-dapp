import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useConnection, useReadContracts } from "wagmi";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { useRouter } from "next/navigation";
import { RootState } from "../../redux/redux.store";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import TokenLogo from "@components/TokenLogo";
import {
	formatCurrency,
	normalizeAddress,
	shortenAddress,
	ALL_CATEGORIES,
	CollateralCategory,
	collateralMatchesCategories,
	FormatType,
} from "@utils";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";

const headers = ["Collateral", "Limit", "Risk Premium", "Reserve", "Min. Locked", "Expiration"];
const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

interface RiskRow {
	originalAddress: string; // the original position, one row each
	collateralAddress: string;
	collateralName: string;
	collateralSymbol: string;
	limit: bigint; // borrowing limit shared by the original and its clones, 18 decimals
	riskPremiumPPM: number | null; // null = V1
	reservePPM: number;
	minLocked: number; // minimum collateral × market price in ZCHF
	expiration: number; // unix seconds
}

function buildRiskRows(positionsByCollateral: PositionQuery[][], prices: PriceQueryObjectArray): RiskRow[] {
	// group every open position under its original, so each original yields exactly one row
	const groups = new Map<string, PositionQuery[]>();
	for (const positions of positionsByCollateral) {
		for (const p of positions) {
			const key = normalizeAddress(p.original);
			const group = groups.get(key);
			if (group) group.push(p);
			else groups.set(key, [p]);
		}
	}

	return Array.from(groups.entries()).map(([originalAddress, group]) => {
		// the original defines the risk parameters; clones inherit them, so use one as fallback
		const basis = group.find((p) => p.isOriginal) ?? group[0];

		const marketPrice = prices[normalizeAddress(basis.collateral)]?.price?.chf ?? 0;
		const minColl = parseFloat(formatUnits(BigInt(basis.minimumCollateral), basis.collateralDecimals));

		return {
			originalAddress,
			collateralAddress: normalizeAddress(basis.collateral),
			collateralName: basis.collateralName,
			collateralSymbol: basis.collateralSymbol,
			limit: BigInt(basis.limitForClones),
			riskPremiumPPM: basis.version === 2 ? basis.riskPremiumPPM : null,
			reservePPM: basis.reserveContribution,
			minLocked: minColl * marketPrice,
			expiration: basis.expiration,
		};
	});
}

export default function CollateralRiskTable() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState(false);
	const [tab, setTab] = useState(headers[4]);
	const [reverse, setReverse] = useState(false);

	const router = useRouter();
	const { address: walletAddress } = useConnection();
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const rows = useMemo(() => buildRiskRows(openPositionsByCollateral, coingecko), [openPositionsByCollateral, coingecko]);

	const uniqueCollaterals = useMemo(() => Array.from(new Set(rows.map((r) => r.collateralAddress))) as Address[], [rows]);

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
		const s = [...rows].sort((a, b) => {
			if (tab === headers[0]) return a.collateralName.localeCompare(b.collateralName) || b.minLocked - a.minLocked;
			if (tab === headers[1]) return b.limit > a.limit ? 1 : b.limit < a.limit ? -1 : 0;
			if (tab === headers[2]) return (b.riskPremiumPPM ?? 0) - (a.riskPremiumPPM ?? 0);
			if (tab === headers[3]) return b.reservePPM - a.reservePPM;
			if (tab === headers[4]) return b.minLocked - a.minLocked;
			if (tab === headers[5]) return b.expiration - a.expiration;
			return 0;
		});
		return reverse ? s.reverse() : s;
	}, [rows, tab, reverse]);

	const filtered = useMemo(() => {
		return sorted.filter((row) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (
					!row.collateralName.toLowerCase().includes(q) &&
					!row.collateralSymbol.toLowerCase().includes(q) &&
					!row.originalAddress.toLowerCase().includes(q)
				)
					return false;
			}
			if (
				activeCategories.length > 0 &&
				!collateralMatchesCategories(row.collateralAddress, activeCategories as CollateralCategory[])
			)
				return false;
			if (inMyWallet && walletAddress && (walletBalanceMap[row.collateralAddress] ?? 0n) === 0n) return false;
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
				searchPlaceholder="Search collateral or position"
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
					<TableRowEmpty>No original positions found.</TableRowEmpty>
				) : (
					filtered.map((row) => {
						const reservePct = row.reservePPM / 10_000;
						const riskPct = row.riskPremiumPPM != null ? row.riskPremiumPPM / 10_000 : null;
						const subtitle = `${row.collateralSymbol} • ${shortenAddress(row.originalAddress as Address)}`;
						const maturity = (row.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24; // days

						return (
							<div key={row.originalAddress} onClick={() => router.push(`/monitoring/${row.originalAddress}`)}>
								<TableRow headers={headers} tab={tab} className="cursor-pointer">
									{/* Collateral */}
									<div className="flex flex-col max-md:mb-5">
										<div className="max-md:hidden md:-ml-12 flex items-center">
											<span className="mr-4">
												<TokenLogo currency={row.collateralSymbol.toLowerCase()} />
											</span>
											<div className="flex flex-col text-left">
												<span className="font-bold text-md max-lg:w-[8rem] lg:w-[10rem] truncate">
													{row.collateralName}
												</span>
												<span className="text-text-subheader text-sm text-nowrap">{subtitle}</span>
											</div>
										</div>
										<div className="md:hidden flex flex-col text-left">
											<span className="font-bold">{row.collateralName}</span>
											<span className="text-text-subheader text-sm">{subtitle}</span>
										</div>
									</div>

									{/* Limit */}
									<div className="text-md font-medium">
										{formatCurrency(formatUnits(row.limit, 18), 2, 2, FormatType.symbol)} ZCHF
									</div>

									{/* Risk Premium */}
									<div className="text-md font-medium">
										{riskPct == null ? (
											<span className="text-text-secondary font-normal text-sm">V1 / n/a</span>
										) : (
											`${formatCurrency(riskPct, 2, 2)}%`
										)}
									</div>

									{/* Reserve */}
									<div className="text-md font-medium">{formatCurrency(reservePct, 2, 2)}%</div>

									{/* Min. Locked */}
									<div className="text-md font-medium">{formatCurrency(row.minLocked, 2, 2, FormatType.symbol)} ZCHF</div>

									{/* Expiration */}
									<div className="flex flex-col">
										<span className="text-md font-medium">
											{new Date(row.expiration * 1000).toLocaleDateString("en-GB", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</span>
										{maturity <= 0 ? (
											<span className="text-sm text-text-warning font-bold">Expired</span>
										) : (
											maturity < 90 && (
												<span
													className={`text-sm ${
														maturity < 7 ? "text-text-warning font-bold" : "text-text-subheader"
													}`}
												>
													{maturity < 3 ? `${Math.round(maturity * 24)}h` : `${Math.round(maturity)}d`}
												</span>
											)
										)}
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
