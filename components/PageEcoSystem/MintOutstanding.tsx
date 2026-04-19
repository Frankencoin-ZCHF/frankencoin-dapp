import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency, FormatType } from "../../utils/format";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TokenLogo from "@components/TokenLogo";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const INITIAL_VISIBLE = 6;

export default function MintOutstanding() {
	const [showAll, setShowAll] = useState(false);
	const router = useRouter();
	const { openPositions } = useSelector((state: RootState) => state.positions);

	const mint = openPositions
		.map((p) => ({
			pos: p.position,
			coll: p.collateralSymbol,
			mint: BigInt(p.minted),
			exp: p.expiration,
		}))
		.sort((a, b) => a.exp - b.exp);

	const mintFiltered = mint.filter((i) => i.mint > 0);
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
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
	};

	const visibleMints = showAll ? mintFiltered : mintFiltered.slice(0, INITIAL_VISIBLE);

	return (
		<AppCard>
			<div className="flex flex-col gap-6">
				{/* Chart */}
				<div className="-mx-4">
					<ApexChart
						type="area"
						height={220}
						options={{
							colors: ["#092f62"],
							stroke: {
								curve: "stepline",
								width: 2,
							},
							fill: {
								type: "gradient",
								gradient: {
									shadeIntensity: 1,
									opacityFrom: 0.15,
									opacityTo: 0.02,
									stops: [0, 100],
								},
							},
							chart: {
								type: "area",
								height: 220,
								sparkline: { enabled: false },
								dropShadow: { enabled: false },
								toolbar: { show: false },
								zoom: { enabled: false },
								background: "0",
							},
							dataLabels: { enabled: false },
							grid: {
								show: true,
								borderColor: "rgba(128,128,128,0.1)",
								strokeDashArray: 4,
								xaxis: { lines: { show: false } },
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									formatter: (value) => {
										const date = new Date(value);
										return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
									},
								},
								axisBorder: { show: false },
								axisTicks: { show: false },
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => `${Math.round(value / 100000) / 10} Mio.`,
								},
								axisBorder: { show: false },
								axisTicks: { show: false },
								min: 0,
								max: (max) => max + max * 0.1,
							},
						}}
						series={[
							{
								name: "Outstanding Supply",
								data: history.map((entry) => [entry.t * 1000, Math.round(parseFloat(formatUnits(entry.m, 16))) / 100]),
							},
						]}
					/>

					{history.length === 0 && (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					)}
				</div>

				{/* Maturity list */}
				<div>
					{visibleMints.map((d, idx) => (
						<div
							key={`${d.pos}_${idx}`}
							className="grid grid-cols-[1fr_auto_1fr] items-center py-3 border-b border-table-header-secondary last:border-0 cursor-pointer hover:bg-table-row-hover duration-200 px-2 -mx-2 rounded"
							onClick={() => router.push(`/monitoring/${d.pos}`)}
						>
							<div className="text-text-secondary text-sm">{dateFormatter(d.exp * 1000)}</div>
							<div className="flex items-center gap-2">
								<TokenLogo currency={d.coll.toLowerCase()} size={5} />
								<span className="font-semibold text-sm">{d.coll}</span>
							</div>
							<div className="text-right font-semibold text-sm">
								{formatCurrency(formatUnits(d.mint, 18), 2, 2, FormatType.symbol)} ZCHF
							</div>
						</div>
					))}

					{mintFiltered.length > INITIAL_VISIBLE && (
						<div className="text-center mt-4">
							<button className="text-sm text-blue-500 hover:text-blue-400 duration-200" onClick={() => setShowAll(!showAll)}>
								{showAll ? "Show less" : `Show all ${mintFiltered.length} maturities`}
							</button>
						</div>
					)}
				</div>
			</div>
		</AppCard>
	);
}
