import AppBox from "@components/AppBox";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useNativePSQuery, usePoolStats, useTradeQuery } from "@hooks";
import { useChainId } from "wagmi";
import dynamic from "next/dynamic";
import { ADDRESS } from "@deuro/eurocoin";
import { POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTranslation } from "next-i18next";

export default function EquityNativePoolShareDetailsCard() {
	const chainId = useChainId();
	const poolStats = usePoolStats();
	const { profit, loss } = useNativePSQuery(ADDRESS[chainId].decentralizedEURO);
	const { trades } = useTradeQuery();
	const { t } = useTranslation();

	return (
		<div className="bg-card-body-primary shadow-card rounded-xl p-4 grid grid-cols-1 gap-2">
			<div id="chart-timeline">
				<div className="flex justify-between">
					<div>
						<DisplayLabel label={t("equity.symbol_price", { symbol: POOL_SHARE_TOKEN_SYMBOL })} />
						<DisplayAmount className="mt-4" bold amount={poolStats.equityPrice} currency={TOKEN_SYMBOL} />
					</div>
					<div className="text-right">
						<DisplayLabel label={t("equity.supply")} />
						<DisplayAmount className="mt-4" bold amount={poolStats.equitySupply} currency={POOL_SHARE_TOKEN_SYMBOL} />
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
					<DisplayLabel label={t("equity.market_cap")} />
					<DisplayAmount
						className="mt-2"
						bold
						amount={(poolStats.equitySupply * poolStats.equityPrice) / BigInt(1e18)}
						currency={TOKEN_SYMBOL}	
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.total_reserve")} />
					<DisplayAmount
						className="mt-2"
						bold
						amount={poolStats.deuroTotalReserve}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.equity_capital")} />
					<DisplayAmount
						className="mt-2"
						bold
						amount={poolStats.deuroEquity}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.minter_reserve")} />
					<DisplayAmount
						className="mt-2"
						bold
						amount={poolStats.deuroMinterReserve}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.total_income")} />
					<DisplayAmount
						className="mt-2 text-text-success"
						bold
						amount={profit}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label={t("equity.total_losses")} />
					<DisplayAmount
						className="mt-2 text-text-warning"
						bold
						amount={loss}
						currency={TOKEN_SYMBOL}
						address={ADDRESS[chainId].decentralizedEURO}
					/>
				</AppBox>
			</div>
		</div>
	);
}
