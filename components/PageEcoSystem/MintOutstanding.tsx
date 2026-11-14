import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency, FormatType } from "../../utils/format";
import TokenLogo from "@components/TokenLogo";
import { amplifierPageLink } from "../../utils/amplifierConstants";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MAX_LOGOS = 6;

// Calendar-based forward windows, cumulative ("within ..."). Windows ending at the same moment are collapsed.
function getWindows(now: Date): { label: string; end: number }[] {
	const y = now.getFullYear();
	const m = now.getMonth();
	const q = Math.floor(m / 3);
	const ts = (d: Date) => Math.floor(d.getTime() / 1000);
	const windows = [
		{ label: "This month", end: ts(new Date(y, m + 1, 1)) },
		{ label: m + 2 === (q + 1) * 3 ? "This quarter" : "Next month", end: ts(new Date(y, m + 2, 1)) },
		{ label: "This quarter", end: ts(new Date(y, (q + 1) * 3, 1)) },
		{ label: "Next quarter", end: ts(new Date(y, (q + 2) * 3, 1)) },
		{ label: "This year", end: ts(new Date(y + 1, 0, 1)) },
		{ label: "Next year", end: ts(new Date(y + 2, 0, 1)) },
	];
	// keep only windows that extend the previous one
	return windows.filter((w, i) => i === 0 || w.end > windows[i - 1].end);
}

export default function MintOutstanding() {
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const amplifiers = useSelector((state: RootState) => state.amplifiers.list);

	const positionMints = openPositions.map((p) => ({
		link: `/monitoring/${p.position}`,
		coll: p.collateralSymbol,
		label: p.collateralSymbol,
		mint: BigInt(p.minted),
		exp: p.expiration,
	}));

	// Amplifiers must be unwound by their expiration as well, so their debt belongs on the
	// trajectory. Swap bridges do not: expiring only stops them, it forces no repayment.
	const amplifierMints = amplifiers.map((a) => ({
		link: amplifierPageLink({ address: a.address, chainId: a.chainId }),
		coll: a.usdSymbol,
		label: `${a.usdSymbol} Amplifier`,
		mint: BigInt(a.totalBorrowed),
		exp: a.expiration,
	}));

	const mint = [...positionMints, ...amplifierMints].sort((a, b) => a.exp - b.exp);

	const mintFiltered = mint.filter((i) => i.mint > 0);
	const totalMint = mint.reduce((a, b) => a + b.mint, 0n);

	const historyBegin = {
		m: totalMint,
		t: Math.round(Date.now() / 1000),
	};

	let latestDebt = totalMint;
	const historyMap = mint.map((i) => {
		latestDebt -= i.mint;
		return {
			m: latestDebt,
			t: i.exp,
		};
	});

	const history = [historyBegin, ...historyMap];

	const maxMintZCHF = Math.round(parseFloat(formatUnits(totalMint, 16))) / 100;

	const getNiceModulus = (max: number): number => {
		if (max === 0) return 1;
		const mag = Math.pow(10, Math.floor(Math.log10(max)));
		const norm = max / mag;
		if (norm <= 1.5) return 0.2 * mag;
		if (norm <= 3) return 0.5 * mag;
		if (norm <= 7) return mag;
		return 2 * mag;
	};

	const yMod = getNiceModulus(maxMintZCHF);
	const yAxisMax = Math.ceil((maxMintZCHF * 1.05) / yMod) * yMod;
	const yTickAmount = Math.round(yAxisMax / yMod);

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
	};

	// Dashed vertical line at every quarter start; new years get a different colour and a label.
	// Drawn as chart series (not annotations) so they always stay aligned with the plot.
	const rangeStart = history[0].t * 1000;
	const rangeEnd = history[history.length - 1].t * 1000;
	const periodMarkers: { x: number; isYear: boolean; year: number; isToday?: boolean }[] = [
		{ x: rangeStart, isYear: false, year: new Date(rangeStart).getFullYear(), isToday: true },
	];
	const markerColor = (m: { isYear: boolean; isToday?: boolean }) => (m.isToday ? "#475569" : m.isYear ? "#0F80F0" : "#94a3b8");
	if (rangeEnd > rangeStart) {
		const first = new Date(rangeStart);
		for (
			let d = new Date(first.getFullYear(), Math.floor(first.getMonth() / 3) * 3, 1);
			d.getTime() <= rangeEnd;
			d.setMonth(d.getMonth() + 3)
		) {
			if (d.getTime() <= rangeStart) continue;
			periodMarkers.push({ x: d.getTime(), isYear: d.getMonth() === 0, year: d.getFullYear() });
		}
	}
	const yearSeriesIdx = periodMarkers.flatMap((m, i) => (m.isYear ? [i + 1] : []));

	const windows = getWindows(new Date()).map((w) => {
		const bySymbol = new Map<string, bigint>();
		let total = 0n;
		for (const i of mintFiltered) {
			if (i.exp >= w.end) continue;
			bySymbol.set(i.coll, (bySymbol.get(i.coll) ?? 0n) + i.mint);
			total += i.mint;
		}
		const tokens = [...bySymbol.entries()].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0));
		return { ...w, total, tokens };
	});

	return (
		<div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
			<AppCard>
				<div className="relative flex-1 min-h-[300px] -mx-4">
					<div className="absolute inset-0">
						<ApexChart
							type="line"
							height="100%"
							options={{
								colors: ["#092f62", ...periodMarkers.map(markerColor)],
								stroke: {
									curve: ["stepline", ...periodMarkers.map(() => "straight" as const)],
									width: [2, ...periodMarkers.map(() => 1.5)],
									dashArray: [0, ...periodMarkers.map((m) => (m.isToday ? 0 : 4))],
								},
								tooltip: { enabledOnSeries: [0], x: { formatter: (value: number) => dateFormatter(value) } },
								legend: { show: false },
								fill: {
									type: ["gradient", ...periodMarkers.map(() => "solid")],
									// gray area under the line, fading out vertically
									colors: ["#94a3b8", ...periodMarkers.map(markerColor)],
									gradient: {
										type: "vertical",
										shade: "light",
										shadeIntensity: 1,
										gradientToColors: ["#94a3b8"],
										opacityFrom: 0.45,
										opacityTo: 0,
										stops: [0, 100],
									},
								},
								chart: {
									type: "line",
									height: "100%",
									sparkline: { enabled: false },
									dropShadow: { enabled: false },
									toolbar: { show: false },
									zoom: { enabled: false },
									background: "0",
								},
								dataLabels: {
									enabled: yearSeriesIdx.length > 0,
									enabledOnSeries: yearSeriesIdx,
									formatter: (_val, opts) => {
										const marker = periodMarkers[opts.seriesIndex - 1];
										return marker?.isYear && opts.dataPointIndex === 1 ? `${marker.year}` : "";
									},
									offsetY: 12,
									style: { fontWeight: 600 },
									background: {
										enabled: true,
										foreColor: "#fff",
										borderRadius: 4,
										borderWidth: 0,
										padding: 4,
										opacity: 1,
									},
								},
								grid: {
									padding: { top: 0, bottom: 0 },
									show: true,
									borderColor: "rgba(128,128,128,0.1)",
									strokeDashArray: 4,
									xaxis: { lines: { show: false } },
								},
								xaxis: {
									type: "datetime",
									tooltip: { enabled: false },
									labels: {
										show: true,
										formatter: (value) => {
											const date = new Date(value);
											return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
										},
									},
									axisBorder: { show: false },
									axisTicks: { show: false },
								},
								yaxis: {
									labels: {
										show: true,
										formatter: (value) => `${Math.round(value / 100000) / 10} Mio.`,
									},
									axisBorder: { show: false },
									axisTicks: { show: false },
									min: 0,
									max: yAxisMax,
									tickAmount: yTickAmount,
								},
							}}
							series={[
								{
									name: "Outstanding Supply",
									type: "area",
									data: history.map((entry) => [entry.t * 1000, Math.round(parseFloat(formatUnits(entry.m, 16))) / 100]),
								},
								...periodMarkers.map((m) => ({
									name: m.isToday ? "Today" : m.isYear ? `${m.year}` : "Quarter",
									type: "line",
									data: [
										[m.x, 0],
										[m.x, yAxisMax],
									],
								})),
							]}
						/>
					</div>
					{history.length === 0 && (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					)}
				</div>
			</AppCard>

			<AppCard>
				<div className="text-text-secondary text-sm">Expiring volume by period</div>
				<div className="flex flex-col">
					{windows.map((w) => (
						<div key={w.label} className="flex flex-col gap-2 py-3 border-b border-table-header-secondary last:border-0">
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm text-text-secondary">Within {w.label.toLowerCase()}</span>
								<span className="font-semibold text-sm">
									{formatCurrency(formatUnits(w.total, 18), 2, 2, FormatType.symbol)} ZCHF
								</span>
							</div>
							<div className="flex items-center gap-1 min-h-6">
								{w.tokens.length === 0 && <span className="text-xs text-text-secondary">Nothing expiring</span>}
								{w.tokens.slice(0, MAX_LOGOS).map(([sym, amount]) => (
									<span
										key={sym}
										title={`${sym}: ${formatCurrency(formatUnits(amount, 18), 2, 2, FormatType.symbol)} ZCHF`}
									>
										<TokenLogo currency={sym.toLowerCase()} size={6} />
									</span>
								))}
								{w.tokens.length > MAX_LOGOS && (
									<span className="text-xs text-text-secondary ml-1">+{w.tokens.length - MAX_LOGOS}</span>
								)}
							</div>
						</div>
					))}
				</div>
			</AppCard>
		</div>
	);
}
