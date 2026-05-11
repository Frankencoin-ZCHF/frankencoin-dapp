import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useConnection, useReadContracts } from "wagmi";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { RootState } from "../../redux/redux.store";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, normalizeAddress, ALL_CATEGORIES, CollateralCategory, collateralMatchesCategories, FormatType } from "@utils";
import { PositionQuery } from "@frankencoin/api";

const headers = ["Collateral", "Positions", "Risk Premium", "Reserve", "Avg Liq. Price", "Min. Locked"];
const FILTER_OPTIONS: FilterOption[] = ALL_CATEGORIES.map((c) => ({ label: c, value: c }));

interface RiskRow {
	collateralAddress: string;
	collateralName: string;
	collateralSymbol: string;
	originalsCount: number;
	clonesCount: number;
	avgRiskPremiumPPM: number | null; // null = V1 only
	avgReservePPM: number;
	avgLiqPrice: number; // ZCHF per collateral unit, human-readable
	minLocked: number; // total min locked in ZCHF across originals
}

function buildRiskRows(positionsByCollateral: PositionQuery[][]): RiskRow[] {
	return positionsByCollateral.map((positions) => {
		const originals = positions.filter((p) => p.isOriginal);
		const clones = positions.filter((p) => p.isClone);
		const collateralDecimals = positions[0].collateralDecimals;
		const priceDigit = 36 - collateralDecimals;

		// Use originals when available, fall back to clones if the original position is closed
		const basis = originals.length > 0 ? originals : clones;

		const v2Basis = basis.filter((p) => p.version === 2);
		const avgRiskPremiumPPM =
			v2Basis.length > 0 ? v2Basis.reduce((sum, p) => sum + ((p as any).riskPremiumPPM as number), 0) / v2Basis.length : null;

		const avgReservePPM = basis.reduce((sum, p) => sum + p.reserveContribution, 0) / basis.length;

		const avgLiqPrice = basis.reduce((sum, p) => sum + parseFloat(formatUnits(BigInt(p.price), priceDigit)), 0) / basis.length;

		const minLocked = basis.reduce((sum, p) => {
			const minColl = parseFloat(formatUnits(BigInt(p.minimumCollateral), p.collateralDecimals));
			const liqPrice = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
			return sum + minColl * liqPrice;
		}, 0);

		return {
			collateralAddress: normalizeAddress(positions[0].collateral),
			collateralName: positions[0].collateralName,
			collateralSymbol: positions[0].collateralSymbol,
			originalsCount: originals.length,
			clonesCount: clones.length,
			avgRiskPremiumPPM,
			avgReservePPM,
			avgLiqPrice,
			minLocked,
		};
	});
}

export default function CollateralRiskTable() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [inMyWallet, setInMyWallet] = useState(false);
	const [tab, setTab] = useState(headers[5]);
	const [reverse, setReverse] = useState(false);

	const { address: walletAddress } = useConnection();
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);

	const rows = useMemo(() => buildRiskRows(openPositionsByCollateral), [openPositionsByCollateral]);

	const uniqueCollaterals = useMemo(() => rows.map((r) => r.collateralAddress as Address), [rows]);

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
			if (tab === headers[0]) return a.collateralName.localeCompare(b.collateralName);
			if (tab === headers[1]) return b.originalsCount + b.clonesCount - (a.originalsCount + a.clonesCount);
			if (tab === headers[2]) return (b.avgRiskPremiumPPM ?? 0) - (a.avgRiskPremiumPPM ?? 0);
			if (tab === headers[3]) return b.avgReservePPM - a.avgReservePPM;
			if (tab === headers[4]) return b.avgLiqPrice - a.avgLiqPrice;
			if (tab === headers[5]) return b.minLocked - a.minLocked;
			return 0;
		});
		return reverse ? s.reverse() : s;
	}, [rows, tab, reverse]);

	const filtered = useMemo(() => {
		return sorted.filter((row) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!row.collateralName.toLowerCase().includes(q) && !row.collateralSymbol.toLowerCase().includes(q)) return false;
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
					filtered.map((row) => {
						const reservePct = row.avgReservePPM / 10_000;
						const riskPct = row.avgRiskPremiumPPM != null ? row.avgRiskPremiumPPM / 10_000 : null;

						const reserveColor = reservePct >= 20 ? "text-green-500" : reservePct >= 10 ? "text-amber-400" : "text-red-500";
						const riskColor =
							riskPct == null
								? "text-text-secondary"
								: riskPct === 0
								? "text-green-500"
								: riskPct < 2
								? "text-amber-400"
								: "text-red-500";

						return (
							<TableRow key={row.collateralAddress} headers={headers} tab={tab}>
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
											<span className="text-text-subheader text-sm">{row.collateralSymbol}</span>
										</div>
									</div>
									<div className="md:hidden font-bold">{row.collateralSymbol}</div>
								</div>

								{/* Positions */}
								<div className="flex flex-col text-md leading-tight">
									<span className="font-medium">
										{row.originalsCount} <span className="text-text-secondary text-sm font-normal">originals</span>
									</span>
									{row.clonesCount > 0 && (
										<span className="font-medium">
											{row.clonesCount} <span className="text-text-secondary text-sm font-normal">clones</span>
										</span>
									)}
								</div>

								{/* Risk Premium */}
								<div className={`text-md font-bold ${riskColor}`}>
									{riskPct == null ? (
										<span className="text-text-secondary font-normal text-sm">V1 / n/a</span>
									) : (
										`${formatCurrency(riskPct, 2, 2)}%`
									)}
								</div>

								{/* Reserve */}
								<div className={`text-md font-bold ${reserveColor}`}>{formatCurrency(reservePct, 2, 2)}%</div>

								{/* Avg Liq. Price */}
								<div className="text-md">{formatCurrency(row.avgLiqPrice, 2, 2, FormatType.symbol)} ZCHF</div>

								{/* Min. Locked */}
								<div className="text-md font-medium">{formatCurrency(row.minLocked, 2, 2, FormatType.symbol)} ZCHF</div>
							</TableRow>
						);
					})
				)}
			</TableBody>
		</Table>
	);
}
