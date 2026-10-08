import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const toDailyValues = (data: [number, number][]) => {
	const dailyMap = new Map<string, [number, number]>();
	data.forEach((entry) => {
		const dateKey = new Date(entry[0]).toDateString();
		if (!dailyMap.has(dateKey)) {
			dailyMap.set(dateKey, entry);
		}
	});
	return [...dailyMap.values()];
};

type MarketChartProps = {
	coin?: "frankencoin" | "frankencoin-shares";
	symbol?: string;
};

export default function MarketChart({ coin = "frankencoin", symbol = "ZCHF" }: MarketChartProps) {
	const isPegged = coin === "frankencoin";
	const timestamp = Date.now() - 20 * 24 * 3600 * 1000;
	const { marketChart } = useSelector((state: RootState) => state.prices);

	const priceList = toDailyValues(marketChart[coin].prices).filter((i) => i["0"] > timestamp);
	const volumeList = toDailyValues(marketChart[coin].total_volumes).filter((i) => i["0"] > timestamp);

	return (
		<div className="grid md:grid-cols-2 gap-4">
			<AppCard>
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
								curve: "smooth",
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
										return `${Math.round(value * (isPegged ? 1000 : 100)) / (isPegged ? 1000 : 100)} CHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								...(isPegged
									? {
											max: (max: number) => Math.max(max, 1.02),
											min: (min: number) => Math.min(min, 0.98),
									  }
									: {}),
							},
						}}
						series={[
							{
								name: `${symbol} Price`,
								data: priceList.map((entry) => {
									return [entry[0], Math.round(entry[1] * 1000) / 1000];
								}),
							},
							...(isPegged
								? [
										{
											name: "Parity",
											data: priceList.map((entry) => {
												return [entry[0], 1];
											}),
										},
								  ]
								: []),
						]}
					/>

					{priceList.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="-m-4 pr-2">
					<ApexChart
						type="bar"
						height={300}
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#092f62", "#0F80F0"],
							stroke: {
								width: 0,
							},
							chart: {
								type: "bar",
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
										return isPegged
											? `${Math.round(value / 100000) / 10}M CHF`
											: `${Math.round(value / 100) / 10}k CHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								...(isPegged ? { max: (max: number) => Math.ceil(max / 1_000_000) * 1_000_000 } : {}),
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
