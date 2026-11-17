import dynamic from "next/dynamic";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Same two series colours as the monitoring page's health chart, checked there for colour-blind separation.
export const CHART_BLUE = "#065DC1";
export const CHART_GREEN = "#0E9F6E";
const AXIS = "#8A90A3";
const HAIRLINE = "rgba(93,100,123,0.12)";

export const shortAmount = (v: number) =>
	v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : formatCurrency(Math.round(v), 0, 0) ?? "0";

export interface ChartSeries {
	name: string;
	color: string;
	/** [unix milliseconds, value] */
	data: [number, number][];
	/** drawn as a dashed line on its own right-hand axis instead of a filled area */
	secondary?: boolean;
	/** false lets the axis start near the lowest value (prices); amounts start at zero */
	fromZero?: boolean;
	format: (v: number) => string;
}

export function Legend({ series }: { series: { name: string; color: string; dashed?: boolean }[] }) {
	return (
		<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
			{series.map((s) => (
				<span key={s.name} className="inline-flex items-center gap-1.5">
					<span
						className="inline-block h-0 w-3.5 border-t-2"
						style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }}
					/>
					{s.name}
				</span>
			))}
		</div>
	);
}

/** Axis bounds on round numbers: [min, max, number of intervals]. */
function niceScale(values: number[], fromZero: boolean): [number, number, number] {
	const hi = Math.max(...values);
	const lo = fromZero ? 0 : Math.min(...values);
	const rough = (hi - lo || 1) / 3;
	const pow = 10 ** Math.floor(Math.log10(rough));
	const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= rough) ?? 10) * pow;
	const min = Math.floor(lo / step) * step;
	const max = Math.ceil(hi / step) * step;
	return [min, max, Math.round((max - min) / step)];
}

function Loading({ height }: { height: number }) {
	return <div className="rounded-lg bg-card-content-primary animate-pulse" style={{ height }} />;
}

/** History of one or two figures: soft filled areas with a dot on the latest value, an optional dashed rate line. */
export function TimeChart({ series, height = 210 }: { series: ChartSeries[]; height?: number }) {
	if (series.some((s) => s.data.length < 2)) return <Loading height={height} />;
	// all filled series share one left-hand scale; a dashed series has its own on the right
	const primary = series.filter((s) => !s.secondary);
	const left = niceScale(
		primary.flatMap((s) => s.data.map((d) => d[1])),
		primary.every((s) => s.fromZero !== false)
	);
	const scaleOf = (s: ChartSeries) =>
		s.secondary
			? niceScale(
					s.data.map((d) => d[1]),
					s.fromZero !== false
			  )
			: left;
	return (
		<div className="-ml-3 -mr-1 -mb-4 -mt-3 min-w-0">
			<ApexChart
				type="line"
				height={height}
				series={series.map((s) => ({ name: s.name, type: s.secondary ? "line" : "area", data: s.data }))}
				options={{
					colors: series.map((s) => s.color),
					chart: {
						toolbar: { show: false },
						zoom: { enabled: false },
						background: "0",
						animations: { enabled: false },
						fontFamily: "inherit",
					},
					stroke: {
						curve: "smooth",
						lineCap: "round",
						width: series.map((s) => (s.secondary ? 2 : 2.5)),
						dashArray: series.map((s) => (s.secondary ? 5 : 0)),
					},
					fill: {
						type: series.map((s) => (s.secondary ? "solid" : "gradient")),
						opacity: 1,
						gradient: { shadeIntensity: 0, opacityFrom: 0.26, opacityTo: 0.01, stops: [0, 95] },
					},
					markers: {
						size: 0,
						strokeWidth: 0,
						hover: { size: 5 },
						// the latest value of every series carries a dot
						discrete: series.map((s, i) => ({
							seriesIndex: i,
							dataPointIndex: s.data.length - 1,
							fillColor: s.color,
							strokeColor: "#FFFFFF",
							size: 4.5,
							shape: "circle" as const,
						})),
					},
					dataLabels: { enabled: false },
					legend: { show: false },
					grid: {
						borderColor: HAIRLINE,
						xaxis: { lines: { show: false } },
						padding: { top: 0, right: 10, left: 8 },
					},
					xaxis: {
						type: "datetime",
						tickAmount: 5,
						labels: { datetimeUTC: false, format: "MMM yy", style: { fontSize: "11px", colors: AXIS } },
						axisBorder: { show: false },
						axisTicks: { show: false },
						tooltip: { enabled: false },
						crosshairs: { stroke: { color: AXIS, width: 1, dashArray: 3 } },
					},
					yaxis: series.map((s, i) => ({
						seriesName: s.secondary ? s.name : series[0].name,
						opposite: !!s.secondary,
						show: i == 0 || !!s.secondary,
						min: scaleOf(s)[0],
						max: scaleOf(s)[1],
						tickAmount: scaleOf(s)[2],
						labels: { formatter: s.format, style: { fontSize: "11px", colors: AXIS } },
					})),
					tooltip: { shared: true, x: { format: "dd MMM yyyy" }, y: series.map((s) => ({ formatter: s.format })) },
				}}
			/>
		</div>
	);
}

export interface CollateralRow {
	symbol: string;
	collateral: number;
	minted: number;
}

/**
 * One line per collateral: the borrowed amount drawn inside the bar of the collateral locked for it, so the
 * part of the bar that sticks out is the over-collateralization.
 */
export function CollateralBars({ rows }: { rows: CollateralRow[] }) {
	if (rows.length == 0) return <Loading height={210} />;
	const max = Math.max(...rows.map((r) => r.collateral));
	return (
		<div className="flex flex-col gap-3">
			{rows.map((r) => (
				<div key={r.symbol} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
					<span className="flex items-center gap-2 min-w-0">
						<TokenLogo currency={r.symbol} size={5} />
						<span className="font-semibold text-text-primary truncate">{r.symbol}</span>
					</span>
					<span
						className="relative h-2.5 rounded-full bg-card-content-primary"
						title={`${shortAmount(r.collateral)} ZCHF collateral, ${shortAmount(r.minted)} ZCHF borrowed`}
					>
						<span
							className="absolute inset-y-0 left-0 rounded-full"
							style={{ width: `${(r.collateral / max) * 100}%`, background: CHART_GREEN, opacity: 0.35 }}
						/>
						<span
							className="absolute inset-y-0 left-0 rounded-full"
							style={{ width: `${(r.minted / max) * 100}%`, background: CHART_BLUE }}
						/>
					</span>
					<span className="tabular-nums text-right text-text-secondary">
						<span className="font-semibold text-text-primary">{shortAmount(r.minted)}</span> / {shortAmount(r.collateral)}
					</span>
				</div>
			))}
		</div>
	);
}

export interface YearBar {
	label: string;
	value: number;
	/** the running year: drawn hatched, because the figure is not final */
	open?: boolean;
}

/** A few yearly figures as columns with the value on top. */
export function YearBars({ bars, color, format }: { bars: YearBar[]; color: string; format: (v: number) => string }) {
	if (bars.length == 0) return <Loading height={150} />;
	const max = Math.max(...bars.map((b) => b.value), 0.0001);
	return (
		<div className="flex items-end gap-3 h-full min-h-[150px]">
			{bars.map((b) => (
				<div key={b.label} className="flex-1 min-w-[2.75rem] h-full flex flex-col items-center justify-end gap-1.5">
					<span className={`text-sm font-bold tabular-nums ${b.value < 0 ? "text-text-warning" : "text-text-primary"}`}>
						{format(b.value)}
					</span>
					<span
						className="w-full rounded-md"
						style={{
							height: `${Math.max(3, (Math.max(b.value, 0) / max) * 100)}px`,
							background: b.open ? `repeating-linear-gradient(135deg, ${color} 0 4px, ${color}55 4px 8px)` : color,
						}}
					/>
					<span className="text-xs text-text-secondary">{b.label}</span>
				</div>
			))}
		</div>
	);
}
