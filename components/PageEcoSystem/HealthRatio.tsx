import AppCard from "../AppCard";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { PriceHistoryRatio } from "@frankencoin/api";
import { formatCurrency } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Series colors, validated for colorblind separation against the white card surface.
// The headline percentages carry the same colors, which is what ties each number to its curve.
const FREE_FLOAT_COLOR = "#065DC1";
const SUPPLY_COLOR = "#0E9F6E";

const FREE_FLOAT_LABEL = "Free float collateralization";
const SUPPLY_LABEL = "Total supply collateralization";

type RatioPoint = { timestamp: number; value: number };

// turns the {timestamp: ratio} map of one series into chronological points of the last year
function toPoints(source: { [key: number]: number } | undefined, cutoff: number): RatioPoint[] {
	if (!source) return [];
	return Object.keys(source)
		.map((k) => ({ timestamp: parseInt(k), value: source[parseInt(k)] }))
		.filter((i) => i.timestamp >= cutoff)
		.sort((a, b) => a.timestamp - b.timestamp);
}

export default function HealthRatio() {
	const [ratioData, setRatioData] = useState<PriceHistoryRatio | null>(null);

	useEffect(() => {
		const fetcher = async () => {
			const response = await FRANKENCOIN_API_CLIENT.get("/prices/history/ratio");
			setRatioData(response.data as PriceHistoryRatio);
		};
		fetcher();
	}, []);

	const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
	const freeFloatPoints = toPoints(ratioData?.collateralRatioByFreeFloat, cutoff);
	const supplyPoints = toPoints(ratioData?.collateralRatioBySupply, cutoff);

	const currentEntry = freeFloatPoints.at(-1);
	const currentPct = (currentEntry?.value || 0) * 100;
	const supplyPct = (supplyPoints.at(-1)?.value || 0) * 100;

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
	};

	const toSeriesData = (points: RatioPoint[]) => points.map((entry) => [entry.timestamp, Math.round(entry.value * 1000) / 10]);

	return (
		<AppCard>
			<div className="flex flex-col gap-6">
				{/* Current values */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<div className="text-4xl font-bold" style={{ color: FREE_FLOAT_COLOR }}>
							{formatCurrency(currentPct, 2)}%
						</div>
						<div className="text-text-secondary text-sm mt-1">{FREE_FLOAT_LABEL}</div>
					</div>
					<div className="sm:text-right">
						<div className="text-4xl font-bold" style={{ color: SUPPLY_COLOR }}>
							{formatCurrency(supplyPct, 2)}%
						</div>
						<div className="text-text-secondary text-sm mt-1">{SUPPLY_LABEL}</div>
					</div>
				</div>

				{/* Chart */}
				<div className="-mx-4">
					<ApexChart
						type="line"
						height={240}
						options={{
							colors: [FREE_FLOAT_COLOR, SUPPLY_COLOR],
							stroke: {
								curve: "smooth",
								width: 2,
							},
							chart: {
								type: "line",
								height: 240,
								sparkline: { enabled: false },
								dropShadow: { enabled: false },
								toolbar: { show: false },
								zoom: { enabled: false },
								background: "0",
							},
							dataLabels: { enabled: false },
							// no legend: the color of each headline percentage identifies its curve
							legend: { show: false },
							grid: {
								show: true,
								borderColor: "rgba(128,128,128,0.1)",
								strokeDashArray: 4,
								xaxis: { lines: { show: false } },
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									formatter: (value) => dateFormatter(Number(value)),
								},
								axisBorder: { show: false },
								axisTicks: { show: false },
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => `${Math.round(value * 10) / 10}%`,
								},
								axisBorder: { show: false },
								axisTicks: { show: false },
								min: 0,
								max: (max) => (Math.floor(max / 100) + 1) * 100,
							},
							tooltip: {
								shared: true,
								x: { format: "dd.MM.yyyy" },
								y: { formatter: (value) => `${formatCurrency(value, 2, 2)}%` },
							},
							annotations: {
								yaxis: [
									{
										y: 100,
										borderColor: "#ef4444",
										strokeDashArray: 4,
									},
								],
							},
						}}
						series={[
							{
								name: FREE_FLOAT_LABEL,
								data: toSeriesData(freeFloatPoints),
							},
							{
								name: SUPPLY_LABEL,
								data: toSeriesData(supplyPoints),
							},
						]}
					/>

					{freeFloatPoints.length === 0 && supplyPoints.length === 0 && (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					)}
				</div>
			</div>
		</AppCard>
	);
}
