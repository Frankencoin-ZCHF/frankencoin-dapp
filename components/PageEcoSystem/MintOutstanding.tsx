import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency } from "../../utils/format";
import AppLink from "@components/AppLink";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MintOutstanding() {
	const { openPositions } = useSelector((state: RootState) => state.positions);

	const mint = openPositions
		.map((p) => ({
			pos: p.position,
			coll: p.collateralSymbol,
			mint: BigInt(p.minted),
			exp: p.expiration,
		}))
		.sort((a, b) => a.exp - b.exp);

	const totalMint = mint.reduce((a, b) => a + b.mint, 0n);

	const historyBegin = {
		m: totalMint,
		t: Math.round(Date.now() / 1000),
	};

	let latestDebt = totalMint;
	const historyMap = mint.map((i) => {
		latestDebt -= i.mint;
		return {
			m: latestDebt,
			t: i.exp,
		};
	});

	const history = [historyBegin, ...historyMap];

	const dateFormatter = (value: number) => {
		const date = new Date(value);
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const y = date.getFullYear();
		return `${d}.${m}.${y}`;
	};

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">Frankencoin Supply Expiration</div>

			<div className="grid md:grid-cols-2 gap-4">
				<div className="pr-2">
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
										return `${Math.round(value / 100000) / 10} Mio.`;
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
									return [entry.t * 1000, Math.round(parseFloat(formatUnits(entry.m, 16))) / 100];
								}),
							},
						]}
					/>

					{history.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>

				<div className="mt-8 space-y-1 gap-2">
					{mint
						.filter((i) => i.mint > 0)
						.slice(0, 8)
						.map((d, idx) => (
							<div key={`${d}_${idx}`} className="flex justify-between">
								<AppLink
									className=""
									href={`/monitoring/${d.pos}`}
									label={`${dateFormatter(d.exp * 1000)} - ${Math.round(
										(d.exp * 1000 - Date.now()) / (24 * 3600 * 1000)
									)}d - ${d.coll}`}
								/>
								<div className="text-text-secondary font-semibold">{formatCurrency(formatUnits(d.mint, 18), 2)} ZCHF</div>
							</div>
						))}
				</div>
			</div>
		</AppCard>
	);
}
