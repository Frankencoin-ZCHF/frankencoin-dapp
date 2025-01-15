import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { TradeChart, useFPSQuery, usePoolStats, useTradeQuery } from "@hooks";
import { useChainId } from "wagmi";
import dynamic from "next/dynamic";
import { ADDRESS } from "@frankencoin/zchf";
import { Dispatch, SetStateAction, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { formatUnits, parseEther, parseUnits } from "viem";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Timeframes = ["All", "1Y", "1Q", "1M", "1W"];
const TypeCharts = ["FPS Price", "FPS Supply", "ZCHF Supply", "Realized Earnings", "Annualized Earnings"];

export default function EquityFPSDetailsCard() {
	const [timeframe, setTimeframe] = useState<string>(Timeframes[1]);
	const [typechart, setTypechart] = useState<string>(TypeCharts[0]);
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const { logs } = useSelector((state: RootState) => state.dashboard.dailyLog);

	// @dev: show trades since start
	let startTrades = Date.now();

	if (timeframe == Timeframes[1]) startTrades -= 365 * 24 * 60 * 60 * 1000; // 1Y
	else if (timeframe == Timeframes[2]) startTrades -= 90 * 24 * 60 * 60 * 1000; // 1Q
	else if (timeframe == Timeframes[3]) startTrades -= 30 * 24 * 60 * 60 * 1000; // 1M
	else if (timeframe == Timeframes[4]) startTrades -= 7 * 24 * 60 * 60 * 1000; // 1W
	else startTrades = 0; // All

	let matchingLogs = logs.filter((t) => {
		return parseInt(t.timestamp) >= startTrades;
	});

	const realizedNetEarningsBegin = BigInt(matchingLogs.at(0)?.realizedNetEarnings || "0");
	const realizedNetEarningsEnd = BigInt(matchingLogs.at(-1)?.realizedNetEarnings || "0");
	const netIncome = realizedNetEarningsEnd - realizedNetEarningsBegin;

	const timestampBegin = BigInt(matchingLogs.at(0)?.timestamp || "0");
	const timestampEnd = BigInt(matchingLogs.at(-1)?.timestamp || "0");
	const timestampDiff = timestampEnd - timestampBegin;
	const oneYear = 365n * 24n * 60n * 60n * 1000n;

	const totalEquity = BigInt(matchingLogs.at(-1)?.totalEquity || "0");
	const annualReturn = totalEquity > 0n ? (((netIncome * parseEther("1")) / totalEquity) * oneYear) / timestampDiff : 0n;

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline">
				<div className="flex justify-between">
					<div>
						<DisplayLabel label="FPS Price" />
						<DisplayAmount className="mt-4" amount={poolStats.equityPrice} currency="ZCHF" />
					</div>
					<div className="text-right">
						<DisplayLabel label="Supply" />
						<DisplayAmount className="mt-4" amount={poolStats.equitySupply} currency="FPS" />
					</div>
				</div>

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
								show: false,
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
									} else if (typechart == TypeCharts[3]) {
										return [
											parseFloat(entry.timestamp),
											Math.round(parseFloat(formatUnits(entry.realizedNetEarnings, 16))) / 100,
										];
									} else {
										return [
											parseFloat(entry.timestamp),
											Math.round(parseFloat(formatUnits(entry.annualNetEarnings, 16))) / 100,
										];
									}
								}),
							},
						]}
					/>
				</div>

				{matchingLogs.length == 0 ? (
					<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
				) : null}

				<TypeTabs tabs={TypeCharts} tab={typechart} setTab={setTypechart} />

				<TimeframeTabs tabs={Timeframes} tab={timeframe} setTab={setTimeframe} />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Market Cap" />
					<DisplayAmount
						className="mt-4"
						amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)}
						currency="ZCHF"
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Reserve" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.frankenTotalReserve}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Equity Capital" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.frankenEquity}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Minter Reserve" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.frankenMinterReserve}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Net Income" />
					<DisplayAmount className="mt-4" amount={netIncome} currency="ZCHF" address={ADDRESS[chainId].frankenCoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Annual Return" />
					<DisplayAmount
						className="mt-4"
						amount={annualReturn * 100n}
						currency="ZCHF"
						unit="%"
						address={ADDRESS[chainId].frankenCoin}
					/>
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
