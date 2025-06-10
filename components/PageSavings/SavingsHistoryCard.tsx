import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { formatCurrency, shortenAddress, TOKEN_SYMBOL } from "@utils";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTranslation } from "next-i18next";
import { formatUnits } from "viem";
import { SegmentedControlButton } from "@components/Button";
import { useTotalSavingsQuery } from "../../hooks/useTotalSavingsQuery";
import { ADDRESS, ERC20ABI } from "@deuro/eurocoin";
import { useChainId, useReadContract } from "wagmi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useContractUrl } from "@hooks";

enum Timeframe {
	WEEK = "1W",
	MONTH = "1M",
	QUARTER = "1Q",
	YEAR = "1Y",
	ALL = "All",
}

const getStartTimestampByTimeframe = (timeframe: Timeframe) => {
	switch (timeframe) {
		case Timeframe.ALL:
			return 0;
		case Timeframe.WEEK:
			return Date.now() - 7 * 24 * 60 * 60 * 1000;
		case Timeframe.MONTH:
			return Date.now() - 30 * 24 * 60 * 60 * 1000;
		case Timeframe.QUARTER:
			return Date.now() - 90 * 24 * 60 * 60 * 1000;
		case Timeframe.YEAR:
			return Date.now() - 365 * 24 * 60 * 60 * 1000;
		default:
			return 0;
	}
};

export default function SavingsHistoryCard() {
	const { rate, totalInterest } = useSelector((state: RootState) => state.savings.savingsInfo);
	const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.ALL);
	const { totalSavings } = useTotalSavingsQuery();
	const { t } = useTranslation();
	const startTrades = getStartTimestampByTimeframe(timeframe);
	const chainId = useChainId();
	const addressSavingsGateway = useContractUrl(ADDRESS[chainId].savingsGateway);

	const { data: current = 0n } = useReadContract({
		address: ADDRESS[chainId].decentralizedEURO,
		abi: ERC20ABI,
		functionName: "balanceOf",
		args: [ADDRESS[chainId].savingsGateway],
	});

	const filteredTrades = useMemo(
		() =>
			totalSavings.filter((totalSavings) => {
				return parseFloat(totalSavings.id) * 1000 > startTrades;
			}),
		[totalSavings, startTrades]
	);

	const maxPrice = useMemo(
		() => Math.max(...filteredTrades.map((trade) => Math.round(Number(trade.total) / 10 ** 16) / 100)),
		[filteredTrades]
	);

	return (
		<div className="bg-layout-primary border border-borders-dividerLight border-offset-1 rounded-xl grid grid-cols-1">
			<div id="chart-timeline" className="relative">
				<div className="absolute top-[20px] left-[20px] z-10 gap-y-0.5 flex flex-col items-start">
					<div className="text-base font-[350] leading-tight">{t("savings.total_savings_history")}</div>
					<div className="text-base font-extrabold leading-tight">
						<span className="text-base font-extrabold leading-tight">{formatCurrency(formatUnits(current, 18), 2, 2)}</span>{" "}
					</div>
				</div>
				<ApexChart
					type="area"
					options={{
						theme: {
							monochrome: {
								color: "#0D4E9C",
								enabled: true,
							},
						},
						chart: {
							type: "area",
							height: 300,
							width: 650,
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
							min: 0,
							max: maxPrice * 2,
						},
						fill: {
							colors: ["#0F80F099"],
							type: "gradient",
							gradient: {
								type: "vertical",
								opacityFrom: 1,
								opacityTo: 0.95,
								gradientToColors: ["#F5F6F9"],
							},
						},
					}}
					series={[
						{
							name: t("savings.total_savings"),
							data: filteredTrades.map((trade) => {
								return [parseFloat(trade.id) * 1000, Number((Number(trade.total) / 10 ** 16 / 100).toFixed(4))];
							}),
						},
					]}
				/>
			</div>
			<div className="py-4 flex flex-row justify-center items-center">
				{Object.values(Timeframe).map((_timeframe) => (
					<SegmentedControlButton selected={_timeframe === timeframe} onClick={() => setTimeframe(_timeframe)}>
						{_timeframe}
					</SegmentedControlButton>
				))}
			</div>
			<div className="flex flex-col justify-start gap-3 py-6 px-5 border-t border-borders-dividerLight border-offset-1">
				<div className="flex flex-row justify-between">
					<div className="text-sm font-medium leading-relaxed">{t("savings.interest_rate_apr")}</div>
					<div className="text-sm font-medium leading-tight ">{rate / 10_000}%</div>
				</div>
				<div className="flex flex-row justify-between">
					<div className="text-sm font-medium leading-relaxed">{t("savings.total_interest_paid")}</div>
					<div className="text-sm font-medium leading-tight ">
						{formatCurrency(totalInterest, 4, 4)} {TOKEN_SYMBOL}
					</div>
				</div>
				<div className="flex flex-row justify-between">
					<div className="text-sm font-medium leading-relaxed">{t("savings.contract_address")}</div>
					<div className="text-sm font-medium leading-tight ">
						<Link href={addressSavingsGateway} target="_blank">
							{shortenAddress(ADDRESS[chainId].savingsGateway)} <FontAwesomeIcon icon={faArrowUpRightFromSquare} size="xs" />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
