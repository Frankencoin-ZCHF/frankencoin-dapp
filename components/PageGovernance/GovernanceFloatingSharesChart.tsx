import dynamic from "next/dynamic";
import AppCard from "@components/AppCard";
import { formatCurrency } from "@utils";
import { colors } from "../../utils/constant";
import { useFcsBindingProgress } from "@hooks";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function GovernanceFloatingSharesChart() {
	const { pct, wfpsPct, isBinding } = useFcsBindingProgress();
	const fcsPct = Math.min(100, Math.max(0, pct));
	const wrappedPct = Math.min(100, Math.max(0, wfpsPct));
	const floatPct = Math.max(0, 100 - fcsPct - wrappedPct);

	const labels = ["Free Float FPS", "Wrapped FPS", "Shares FCS"];
	const series = [floatPct, wrappedPct, fcsPct];

	return (
		<AppCard>
			<div className="grid md:grid-cols-2 gap-4">
				<div className="pr-2 my-auto">
					<ApexChart
						height={"350px"}
						type="donut"
						options={{
							chart: { type: "donut", background: "0" },
							colors,
							theme: { palette: "palette2" },
							labels,
							dataLabels: {
								enabled: true,
								formatter: (val: number) => `${formatCurrency(val, 0, 1)}%`,
							},
							tooltip: {
								y: { formatter: (val: number) => `${formatCurrency(val, 0, 2)}% of all FPS votes` },
							},
							legend: {
								show: false,
							},
							plotOptions: {
								pie: {
									donut: {
										labels: {
											show: true,
											total: {
												show: true,
												label: "Voting Power",
												formatter: () => "100%",
											},
										},
									},
								},
							},
						}}
						series={series}
					/>
				</div>

				<div className="my-auto space-y-1">
					<div className="text-text-primary font-bold mb-2">FPS Voting Distribution</div>
					<div className="text-text-secondary text-sm pb-3">
						Every FPS holder who wraps into WFPS or FCS moves their voting power out of the free-floating pool. WFPS still
						accumulates votes on its balance like any holder, but implements no governance mechanism. FCS instead pools its
						holders' votes into a single bloc
						{isBinding ? (
							<span className="text-amber-500 font-medium">
								{" "}
								that is currently binding — it can shoot unwrapped FPS votes
							</span>
						) : (
							" with its own, lower qualification threshold"
						)}
						.
					</div>
					{labels.map((label, idx) => (
						<div key={label} className="flex justify-between">
							<div className="text-text-secondary font-semibold" style={{ color: colors[idx % colors.length] }}>
								{label}
							</div>
							<div className="text-text-secondary font-semibold">{formatCurrency(series[idx], 0, 2)}%</div>
						</div>
					))}
					<div className="flex justify-between">
						<div className="text-text-primary font-semibold mt-2">
							Total <span className="text-sm">(100%)</span>
						</div>
						<div className="text-text-primary font-semibold mt-2">of all FPS votes</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
