import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { PriceHistoryRatio } from "@frankencoin/api";
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

			const keys = Object.keys(ratio.collateralRatioByFreeFloat);
			const data: ChartData[] = keys.map((i) => ({
				timestamp: parseInt(i),
				value: ratio.collateralRatioByFreeFloat[parseInt(i)],
			}));

			setChartData(data);
		};

		fetcher();
	}, []);

	const date = Date.now() - 10 * 24 * 60 * 60 * 1000;
	const chartList = chartData.filter((i) => i.timestamp >= date);

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const y = date.getFullYear();
		return `${d}.${m}.${y}`;
	};

	return (
		<div className="grid md:grid-cols-2 gap-4">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Health of Frankencoin</div>

				<div className="-m-4 pr-2">
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
								width: 3,
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
										return `${Math.round(value * 1000) / 1000}%`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								max: (max) => {
									return max;
								},
								min: 0,
							},
						}}
						series={[
							{
								name: "Health",
								data: chartList.map((entry) => {
									return [entry.timestamp, Math.round(entry.value * 1000) / 10];
								}),
							},
							{
								name: "Minimum",
								data: chartList.map((entry) => {
									return [entry.timestamp, 100];
								}),
							},
						]}
					/>

					{chartList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>
		</div>
	);
}
