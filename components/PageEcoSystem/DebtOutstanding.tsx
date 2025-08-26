import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DebtOutstanding() {
	const { openPositions } = useSelector((state: RootState) => state.positions);

	const debt = openPositions
		.map((p) => ({
			d: (BigInt(p.minted) * BigInt(1_000_000 - p.reserveContribution)) / BigInt(1_000_000),
			exp: p.expiration,
		}))
		.sort((a, b) => a.exp - b.exp);

	const totalDebt = debt.reduce((a, b) => a + b.d, 0n);

	const historyBegin = {
		d: totalDebt,
		t: Math.round(Date.now() / 1000),
	};

	let latestDebt = totalDebt;
	const historyMap = debt.map((i) => {
		latestDebt -= i.d;
		return {
			d: latestDebt,
			t: i.exp,
		};
	});

	const history = [historyBegin, ...historyMap];

	return (
		<div className="">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Open Debt projected over Expiration</div>

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
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value / 100000) / 10} Mio. ZCHF`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								min: 0,
								max: (max) => {
									return max + max * 0.1;
								},
							},
						}}
						series={[
							{
								name: "Mint",
								data: history.map((entry) => {
									return [entry.t * 1000, Math.round(parseFloat(formatUnits(entry.d, 16))) / 100];
								}),
							},
						]}
					/>

					{history.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>
		</div>
	);
}
