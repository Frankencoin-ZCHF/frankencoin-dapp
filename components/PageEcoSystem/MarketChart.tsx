import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatUnits } from "viem";
import AppCard from "../AppCard";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const toDailyValues = (data: [number, number][]) => {
	// @dev: keeps the latest entry per day, so the current day reflects the most recent value instead of its first (midnight) one
	const dailyMap = new Map<string, [number, number]>();
	data.forEach((entry) => {
		dailyMap.set(new Date(entry[0]).toDateString(), entry);
	});
	return [...dailyMap.values()];
};

// @dev: carries the last known value forward to now, so the line does not end early on days without trades
const extendToNow = (data: [number, number][], now: number): [number, number][] => {
	const last = data[data.length - 1];
	if (!last || Date.now() - last[0] < 1000) return data;
	return [...data, [now, last[1]]];
};

// rounds a value to a round number one order of magnitude below its own (e.g. 4.37 -> 4.4, 0.0231 -> 0.024), or two orders below with `fine`
const snapToStep = (value: number, round: (n: number) => number, fine = false) => {
	if (!(value > 0)) return 0;
	const step = Math.pow(10, Math.floor(Math.log10(value)) - (fine ? 2 : 1));
	return Math.round(round(value / step) * step * 1e12) / 1e12;
};

type MarketChartProps = {
	coin?: "frankencoin" | "frankencoin-shares";
	symbol?: string;
};

export default function MarketChart({ coin = "frankencoin", symbol = "ZCHF" }: MarketChartProps) {
	const isPegged = coin === "frankencoin";
	const timestamp = Date.now() - 20 * 24 * 3600 * 1000;
	const { marketChart } = useSelector((state: RootState) => state.prices);
	const dailyLogs = useSelector((state: RootState) => state.dashboard.dailyLog.logs);

	const now = Date.now();
	const priceList = extendToNow(
		toDailyValues(marketChart[coin].prices).filter((i) => i["0"] > timestamp),
		now
	);
	const volumeList = toDailyValues(marketChart[coin].total_volumes).filter((i) => i["0"] > timestamp);

	// @dev: for FCS, compare the market price against the protocol (mint/redeem) price from the daily log
	const protocolPriceList = isPegged
		? []
		: extendToNow(
				dailyLogs
					.map((entry): [number, number] => [
						parseFloat(entry.timestamp) * 1000,
						Math.round(parseFloat(formatUnits(entry.fpsPrice, 16))) / 100,
					])
					.filter((i) => i[0] > timestamp),
				now
		  );

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
									: {
											max: (max: number) => snapToStep(max * 1.01, Math.ceil, true),
											min: (min: number) => Math.max(0, snapToStep(min * 0.99, Math.floor, true)),
									  }),
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
								: [
										{
											name: `${symbol} Protocol Price`,
											data: protocolPriceList,
										},
								  ]),
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
