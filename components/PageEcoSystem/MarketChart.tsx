import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MarketChart() {
	const { marketChart } = useSelector((state: RootState) => state.prices);

	const date = Date.now() - 10 * 24 * 60 * 60 * 1000;
	const priceList = marketChart.prices.filter((i) => i[0] >= date);
	const volumeList = marketChart.total_volumes.filter((i) => i[0] >= date);

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
				<div className="mt-4 text-lg font-bold text-center">Market Price of Frankencoin</div>

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
									return max;
								},
								min: (min) => {
									return min;
								},
							},
						}}
						series={[
							{
								name: "Price",
								data: priceList.map((entry) => {
									return [entry[0], Math.round(entry[1] * 1000) / 1000];
								}),
							},
							{
								name: "Target",
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
				<div className="mt-4 text-lg font-bold text-center">Volume of Frankencoin</div>

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
										return `${Math.round(value)} CHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								max: (max) => {
									return max + max * 0.01;
								},
								// min: (min) => {
								// 	return min - min * 0.01;
								// },
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
