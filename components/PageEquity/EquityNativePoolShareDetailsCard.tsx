import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useNativePSQuery, usePoolStats, useTradeQuery } from "@hooks";
import { useChainId } from "wagmi";
import dynamic from "next/dynamic";
import { ADDRESS } from "@deuro/eurocoin";
import { POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function EquityNativePoolShareDetailsCard() {
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const { profit, loss } = useNativePSQuery(ADDRESS[chainId].decentralizedEURO);
	const { trades } = useTradeQuery();

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline">
				<div className="flex justify-between">
					<div>
						<DisplayLabel label={`${POOL_SHARE_TOKEN_SYMBOL} Price`} />
						<DisplayAmount className="mt-4" amount={poolStats.equityPrice} currency={TOKEN_SYMBOL} />
					</div>
					<div className="text-right">
						<DisplayLabel label="Supply" />
						<DisplayAmount className="mt-4" amount={poolStats.equitySupply} currency={POOL_SHARE_TOKEN_SYMBOL} />
					</div>
				</div>
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
							name: `${POOL_SHARE_TOKEN_SYMBOL} Price`,
							data: trades.map((trade) => {
								return [parseFloat(trade.time) * 1000, Math.round(Number(trade.lastPrice) / 10 ** 16) / 100];
							}),
						},
					]}
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Market Cap" />
					<DisplayAmount
						className="mt-4"
						amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)}
						currency={TOKEN_SYMBOL}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Reserve" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.deuroTotalReserve}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Equity Capital" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.deuroEquity}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Minter Reserve" />
					<DisplayAmount
						className="mt-4"
						amount={poolStats.deuroMinterReserve}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Income" />
					<DisplayAmount
						className="mt-4 text-text-success"
						amount={profit}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Losses" />
					<DisplayAmount
						className="mt-4 text-text-warning"
						amount={loss}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
			</div>
		</div>
	);
}
