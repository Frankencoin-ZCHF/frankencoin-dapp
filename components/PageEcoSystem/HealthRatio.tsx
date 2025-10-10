import AppCard from "../AppCard";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { PriceHistoryRatio } from "@frankencoin/api";
import { formatCurrency } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartData = {
	timestamp: number;
	value: number;
};

export default function HealthRatio() {
	const [chartData, setChartData] = useState<ChartData[]>([]);

	useEffect(() => {
		const fetcher = async () => {
			const response = await FRANKENCOIN_API_CLIENT.get("/prices/history/ratio");
			const ratio = response.data as PriceHistoryRatio;

			const keys = Object.keys(ratio.collateralRatioByFreeFloat).map((i) => parseInt(i));

			const data: ChartData[] = keys.map((i) => ({
				timestamp: i,
				value: ratio.collateralRatioByFreeFloat[i],
			}));

			const date = Date.now() - 365 * 24 * 60 * 60 * 1000;

			const chartFiltered = data.filter((i) => {
				if (i.timestamp < date) return false;
				else {
					const d = new Date(i.timestamp);
					if (d.getHours() % 2 == 0) return true;
					else return false;
				}
			});

			setChartData(chartFiltered);
		};

		fetcher();
	}, []);

	const chartListTimestamp = [...chartData].sort((a, b) => a.timestamp - b.timestamp);
	const currentEntry = chartListTimestamp.at(-1);

	const sortedList = [...chartData].sort((a, b) => a.value - b.value);
	const sortedLowest = sortedList.at(0);
	const sortedHighest = sortedList.at(-1);

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const y = date.getFullYear();
		const h = date.getHours();
		return `${d}.${m}.${y} ${h}:00`;
	};

	return (
		<AppCard>
			<div className="grid md:grid-cols-2 gap-4">
				<div className="pr-2">
					<div className="mt-4 text-lg font-bold text-center">Free Supply Collateralization</div>
					<ApexChart
						type="line"
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#092f62", "#0F80F0"],
							stroke: {
								curve: "linestep",
								width: 2,
							},
							chart: {
								type: "line",
								height: 100,
								dropShadow: {
									enabled: false,
								},
								toolbar: {
									show: false,
								},
								zoom: {
									enabled: false,
								},
								background: "0",
							},
							dataLabels: {
								enabled: false,
							},
							grid: {
								show: false,
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									formatter: (value) => {
										const date = new Date(value);
										const d = date.getDate();
										const m = date.getMonth() + 1;
										const y = date.getFullYear();
										const h = date.getHours();
										return `${d}.${m}.${y} ${h}:00`;
									},
								},
								axisBorder: {
									show: false,
								},
								axisTicks: {
									show: false,
								},
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value * 10) / 10}%`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								min: 0,
								max: (max) => {
									return (Math.floor(max / 100) + 1) * 100;
								},
							},
						}}
						series={[
							{
								name: "Collateralization",
								data: chartListTimestamp.map((entry) => {
									return [entry.timestamp, Math.round(entry.value * 1000) / 10];
								}),
							},
							{
								name: "Minimum",
								data: chartListTimestamp.map((entry) => {
									return [entry.timestamp, 100];
								}),
							},
						]}
					/>

					{chartListTimestamp.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>

				<div className="mt-4 space-y-1">
					<div className="mb-8 text-lg font-bold text-center">Historic Watermarks</div>
					<div className="flex justify-between">
						<div className="text-text-primary font-semibold">
							<div>Current</div>
							<span className="text-sm font-normal">{dateFormatter(currentEntry?.timestamp || 0)}</span>
						</div>
						<div className="text-text-primary font-semibold">{formatCurrency((currentEntry?.value || 0) * 100, 0)}%</div>
					</div>
					<div className="flex justify-between">
						<div className="text-text-secondary font-semibold">
							<div>Lowest</div>
							<span className="text-sm font-normal">{dateFormatter(sortedLowest?.timestamp || 0)}</span>
						</div>
						<div className="text-text-secondary">{formatCurrency((sortedLowest?.value || 0) * 100, 0)}%</div>
					</div>
					<div className="flex justify-between">
						<div className="text-text-secondary font-semibold">
							<div>Highest</div>
							<span className="text-sm font-normal">{dateFormatter(sortedHighest?.timestamp || 0)}</span>
						</div>
						<div className="text-text-secondary font-normal">{formatCurrency((sortedHighest?.value || 0) * 100, 0)}%</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
