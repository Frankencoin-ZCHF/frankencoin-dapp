import dynamic from "next/dynamic";
import { formatCurrency } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Same two series colours as the monitoring page's health chart, checked there for colour-blind separation.
export const CHART_BLUE = "#065DC1";
export const CHART_GREEN = "#0E9F6E";

export const shortAmount = (v: number) =>
	v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : formatCurrency(Math.round(v), 0, 0) ?? "0";

export interface ChartSeries {
	name: string;
	color: string;
	/** [unix milliseconds, value] */
	data: [number, number][];
	/** drawn on its own right-hand axis, as a stepped line */
	secondary?: boolean;
	format: (v: number) => string;
}

const HEIGHT = 190;

function Legend({ series }: { series: { name: string; color: string }[] }) {
	return (
		<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
			{series.map((s) => (
				<span key={s.name} className="inline-flex items-center gap-1.5">
					<span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
					{s.name}
				</span>
			))}
		</div>
	);
}

function Loading() {
	return <div className="rounded-lg bg-card-content-primary animate-pulse" style={{ height: HEIGHT }} />;
}

/** History of one or two figures over time. */
export function TimeChart({ series }: { series: ChartSeries[] }) {
	if (series.some((s) => s.data.length < 2)) return <Loading />;
	return (
		<div className="flex flex-col gap-1 min-w-0">
			<Legend series={series} />
			<div className="-ml-2 -mb-3">
				<ApexChart
					type="line"
					height={HEIGHT}
					series={series.map((s) => ({ name: s.name, type: s.secondary ? "line" : "area", data: s.data }))}
					options={{
						colors: series.map((s) => s.color),
						chart: { toolbar: { show: false }, zoom: { enabled: false }, background: "0", animations: { enabled: false } },
						stroke: { curve: series.map((s) => (s.secondary ? "stepline" : "straight")) as any, width: 2 },
						fill: { type: "solid", opacity: series.map((s) => (s.secondary ? 1 : 0.12)) },
						dataLabels: { enabled: false },
						legend: { show: false },
						grid: { borderColor: "rgba(128,128,128,0.12)", strokeDashArray: 4, padding: { top: -10, right: 4 } },
						xaxis: {
							type: "datetime",
							labels: { datetimeUTC: false, style: { fontSize: "11px" } },
							axisBorder: { show: false },
							axisTicks: { show: false },
							tooltip: { enabled: false },
						},
						yaxis: series.map((s, i) => ({
							// all left-hand series share the first one's scale
							seriesName: s.secondary ? s.name : series[0].name,
							opposite: !!s.secondary,
							show: i == 0 || !!s.secondary,
							min: 0,
							tickAmount: 3,
							forceNiceScale: true,
							labels: { formatter: s.format, style: { fontSize: "11px" } },
						})),
						tooltip: { shared: true, x: { format: "dd MMM yyyy" }, y: series.map((s) => ({ formatter: s.format })) },
					}}
				/>
			</div>
		</div>
	);
}

export interface BarGroup {
	label: string;
	values: number[];
}

/** Two figures side by side for a handful of categories, as horizontal bars. */
export function BarChart({ names, colors, groups }: { names: string[]; colors: string[]; groups: BarGroup[] }) {
	if (groups.length == 0) return <Loading />;
	return (
		<div className="flex flex-col gap-1 min-w-0">
			<Legend series={names.map((name, i) => ({ name, color: colors[i] }))} />
			<div className="-ml-2 -mb-3">
				<ApexChart
					type="bar"
					height={HEIGHT}
					series={names.map((name, i) => ({ name, data: groups.map((g) => Math.round(g.values[i])) }))}
					options={{
						colors,
						chart: { toolbar: { show: false }, background: "0", animations: { enabled: false } },
						plotOptions: { bar: { horizontal: true, barHeight: "70%", borderRadius: 2 } },
						stroke: { width: 2, colors: ["transparent"] },
						dataLabels: { enabled: false },
						legend: { show: false },
						grid: {
							borderColor: "rgba(128,128,128,0.12)",
							strokeDashArray: 4,
							xaxis: { lines: { show: true } },
							yaxis: { lines: { show: false } },
							padding: { top: -10, right: 8 },
						},
						xaxis: {
							categories: groups.map((g) => g.label),
							tickAmount: 4,
							labels: { formatter: (v) => shortAmount(Number(v)), style: { fontSize: "11px" } },
							axisBorder: { show: false },
							axisTicks: { show: false },
						},
						yaxis: { labels: { style: { fontSize: "11px" } } },
						tooltip: { shared: true, intersect: false, y: { formatter: (v) => `${shortAmount(v)} ZCHF` } },
					}}
				/>
			</div>
		</div>
	);
}
