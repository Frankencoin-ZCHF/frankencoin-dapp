import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useFPSQuery, usePoolStats, useTradeQuery } from "@hooks";
import { useChainId } from "wagmi";
import dynamic from "next/dynamic";
import { ADDRESS } from "@frankencoin/zchf";
import { Dispatch, SetStateAction, useState } from "react";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Timeframes = ["All", "1Y", "1Q", "1M", "1W", "1D"];

export default function EquityFPSDetailsCard() {
	const [timeframe, setTimeframe] = useState<string>(Timeframes[1]);
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const { profit, loss } = useFPSQuery(ADDRESS[chainId].frankenCoin);
	const { trades } = useTradeQuery();

	// @dev: show trades since start
	let startTrades = Date.now() / 1000;

	if (timeframe == Timeframes[1]) startTrades -= 365 * 24 * 60 * 60; // 1Y
	else if (timeframe == Timeframes[2]) startTrades -= 90 * 24 * 60 * 60; // 1Q
	else if (timeframe == Timeframes[3]) startTrades -= 30 * 24 * 60 * 60; // 1M
	else if (timeframe == Timeframes[4]) startTrades -= 7 * 24 * 60 * 60; // 1W
	else if (timeframe == Timeframes[5]) startTrades -= 24 * 60 * 60; // 1D
	else startTrades = 0; // All

	const matchingTrades = trades.filter((t) => {
		return parseInt(t.time) >= startTrades;
	});

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
										const d = date.getDay();
										const m = date.getMonth();
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
								name: "FPS Price",
								data: matchingTrades.map((trade) => {
									return [parseFloat(trade.time) * 1000, Math.round(Number(trade.lastPrice) / 10 ** 16) / 100];
								}),
							},
						]}
					/>
				</div>

				{matchingTrades.length == 0 ? (
					<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
				) : null}

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
					<DisplayLabel label="Total Income" />
					<DisplayAmount
						className="mt-4 text-text-success"
						amount={profit}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Spendings" />
					<DisplayAmount
						className="mt-4 text-text-warning"
						amount={loss}
						currency="ZCHF"
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
