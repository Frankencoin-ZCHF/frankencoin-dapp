import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { usePoolStats } from "@hooks";
import dynamic from "next/dynamic";
import { ADDRESS } from "@frankencoin/zchf";
import { Dispatch, SetStateAction, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatUnits, parseEther } from "viem";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { mainnet } from "viem/chains";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Timeframes = ["All", "1Y", "1Q", "1M", "1W"];
const TypeCharts = ["FPS Price", "FPS Supply", "ZCHF Supply"];

export default function EquityFPSDetailsCard() {
	const [timeframe, setTimeframe] = useState<string>(Timeframes[1]);
	const [typechart, setTypechart] = useState<string>(TypeCharts[0]);
	const chainId = mainnet.id;
	const poolStats = usePoolStats();
	const { logs } = useSelector((state: RootState) => state.dashboard.dailyLog);

	// @dev: show trades since start
	let startTrades = Date.now();

	if (timeframe == Timeframes[1]) startTrades -= (365 + 1) * 24 * 60 * 60 * 1000; // 1Y
	else if (timeframe == Timeframes[2]) startTrades -= (90 + 1) * 24 * 60 * 60 * 1000; // 1Q
	else if (timeframe == Timeframes[3]) startTrades -= (30 + 1) * 24 * 60 * 60 * 1000; // 1M
	else if (timeframe == Timeframes[4]) startTrades -= (7 + 1) * 24 * 60 * 60 * 1000; // 1W
	else startTrades = 0; // All

	let matchingLogs = logs.filter((t) => {
		return parseInt(t.timestamp) >= startTrades;
	});

	const adjustedInflow = BigInt(matchingLogs.at(-1)?.totalInflow || "0") - BigInt(matchingLogs.at(0)?.totalInflow || "0");
	const adjustedOutflow = BigInt(matchingLogs.at(-1)?.totalOutflow || "0") - BigInt(matchingLogs.at(0)?.totalOutflow || "0");
	const netIncome = adjustedInflow - adjustedOutflow;

	const timestampBegin = BigInt(matchingLogs.at(0)?.timestamp || "0");
	const timestampEnd = BigInt(Date.now());
	const timestampDiff = timestampEnd - timestampBegin;
	const oneYearMs = 365n * 24n * 60n * 60n * 1000n;

	const equityStart = BigInt(matchingLogs.at(0)?.totalEquity || "0");
	const equityEnd = BigInt(matchingLogs.at(-1)?.totalEquity || "0");
	const equityAvg = (equityStart + equityEnd) / 2n;
	const returnOnEquity = equityAvg > 0n ? (((netIncome * parseEther("1")) / equityAvg) * oneYearMs) / timestampDiff : 0n;

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline">
				<TypeTabs tabs={TypeCharts} tab={typechart} setTab={setTypechart} />

				<div className="-m-2">
					<ApexChart
						type="area"
						options={{
							theme: {
								monochrome: {
									color: "#092f62",
									enabled: true,
								},
							},
							chart: {
								type: "area",
								height: 300,
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
							stroke: {
								width: 3,
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
									show: false,
									formatter: (value) => {
										const date = new Date(value);
										const d = date.getDate();
										const m = date.getMonth() + 1;
										const y = date.getFullYear();
										return `${d}.${m}.${y}`;
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
								min: 0,
								labels: {
									show: true,
									formatter: (value) => {
										if (typechart == TypeCharts[2]) {
											return `${Math.round(value / 100000) / 10} Mio`;
										} else {
											return value.toString();
										}
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
							},
							fill: {
								type: "gradient",
								gradient: {
									shadeIntensity: 0,
									opacityTo: 0.2,
									shade: "#e7e7ea",
									gradientToColors: ["#092f62"],
								},
							},
						}}
						series={[
							{
								name: typechart,
								data: matchingLogs.map((entry) => {
									if (typechart == TypeCharts[0]) {
										return [parseFloat(entry.timestamp), Math.round(parseFloat(formatUnits(entry.fpsPrice, 16))) / 100];
									} else if (typechart == TypeCharts[1]) {
										return [
											parseFloat(entry.timestamp),
											Math.round(parseFloat(formatUnits(entry.fpsTotalSupply, 16))) / 100,
										];
									} else if (typechart == TypeCharts[2]) {
										return [
											parseFloat(entry.timestamp),
											Math.round(parseFloat(formatUnits(entry.totalSupply, 16))) / 100,
										];
									} else {
										return [parseFloat(entry.timestamp), Math.round(parseFloat(formatUnits(entry.fpsPrice, 16))) / 100];
									}
								}),
							},
						]}
					/>
				</div>

				{matchingLogs.length == 0 ? (
					<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
				) : null}

				<TimeframeTabs tabs={Timeframes} tab={timeframe} setTab={setTimeframe} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="FPS Price" />
					<DisplayAmount amount={poolStats.equityPrice} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Supply" />
					<DisplayAmount amount={poolStats.equitySupply} currency="FPS" address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Market Cap." />
					<DisplayAmount
						amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankencoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Equity Capital" />
					<DisplayAmount amount={poolStats.frankenEquity} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={"Net Income (" + timeframe + ")"} />
					<DisplayAmount amount={netIncome} currency="ZCHF" address={ADDRESS[chainId].frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label={timeframe == "1Y" ? "Return on Equity" : "RoE (annualized from " + timeframe + ")"} />
					<DisplayOutputAlignedRight amount={returnOnEquity * 100n} unit="%" />
				</AppBox>
			</div>
		</div>
	);
}

interface TimeframeTabsInterface {
	tabs: string[];
	tab: string;
	setTab: Dispatch<SetStateAction<string>>;
}

function TimeframeTabs(params: TimeframeTabsInterface) {
	const { tabs, tab, setTab } = params;
	if (tabs.length == 0) return null;

	return (
		<div className="bg-card-content-primary mb-5 rounded-2xl">
			<div className="flex flex-row justify-between px-6 text-text-secondary">
				{tabs.map((ts) => (
					<div
						key={"key_" + ts}
						className={`px-6 max-md:px-2 py-2 ${ts == tab ? "text-text-primary font-semibold" : "cursor-pointer"}`}
						onClick={() => setTab(ts)}
					>
						{ts}
					</div>
				))}
			</div>
		</div>
	);
}

interface TypeTabsInterface {
	tabs: string[];
	tab: string;
	setTab: Dispatch<SetStateAction<string>>;
}

function TypeTabs(params: TypeTabsInterface) {
	const { tabs, tab, setTab } = params;
	if (tabs.length == 0) return null;

	return (
		<div className="bg-card-content-primary mb-5 rounded-2xl">
			<div className="flex flex-row justify-between px-6 text-text-secondary">
				{tabs.map((ts) => (
					<div
						key={"key_" + ts}
						className={`px-6 max-md:px-2 py-2 text-sm text-center ${
							ts == tab ? "text-text-primary font-semibold" : "cursor-pointer"
						}`}
						onClick={() => setTab(ts)}
					>
						{ts}
					</div>
				))}
			</div>
		</div>
	);
}
