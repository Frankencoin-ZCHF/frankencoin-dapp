import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MarketChart() {
	const { marketChart } = useSelector((state: RootState) => state.prices);

	const date = 0; // Date.now() - 10 * 24 * 60 * 60 * 1000;
	const priceList = marketChart.prices.filter((i) => i[0] >= date);
	const volumeList = marketChart.total_volumes.filter((i) => i[0] >= date);

	return (
		<div className="grid grid-cols-1 gap-4">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Exchange Rate</div>

				<div className="-m-4 pr-2">
					<ApexChart
						type="line"
						height={300}
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
									datetimeUTC: false,
									datetimeFormatter: {
										month: "MMM yyyy",
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
										return `${Math.round(value * 1000) / 1000} CHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								max: (max) => {
									return Math.max(max, 1.05);
								},
								min: (min) => {
									return Math.min(min, 0.95);
								},
							},
						}}
						series={[
							{
								name: "ZCHF Price",
								data: priceList.map((entry) => {
									return [entry[0], Math.round(entry[1] * 1000) / 1000];
								}),
							},
							{
								name: "Parity",
								data: priceList.map((entry) => {
									return [entry[0], 1];
								}),
							},
						]}
					/>

					{priceList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">24h Trading Volume</div>

				<div className="-m-4 pr-2">
					<ApexChart
						type="line"
						height={300}
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
									datetimeUTC: false,
									datetimeFormatter: {
										month: "MMM yyyy",
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
										return `${Math.round(value / 100000) / 10}M CHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								max: (max) => {
									return Math.ceil(max / 1_000_000) * 1_000_000;
								},
								min: 0,
							},
						}}
						series={[
							{
								name: "Volume",
								data: volumeList.map((entry) => {
									return [entry[0], Math.round(entry[1])];
								}),
							},
						]}
					/>

					{volumeList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>
		</div>
	);
}
