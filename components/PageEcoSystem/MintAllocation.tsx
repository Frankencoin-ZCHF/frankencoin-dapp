import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency } from "../../utils/format";
import { colors } from "../../utils/constant";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, StablecoinBridgeABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MintAllocation() {
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const [swapBridgeVCHF, setSwapBridgeVCHF] = useState(0n);

	// Aggregate collateral
	const byCollateral = new Map<string, bigint>();
	(openPositions ?? []).forEach((p) => {
		const key = String(p.collateralSymbol);
		byCollateral.set(key, (byCollateral.get(key) ?? 0n) + BigInt(p.minted));
	});

	// Aggregate swap bridges
	byCollateral.set("VCHF", swapBridgeVCHF);

	const mapping = [...byCollateral.keys()]
		.map((label, idx) => {
			return {
				label,
				value: byCollateral.get(label) ?? 0n,
			};
		})
		.sort((a, b) => (b.value > a.value ? 1 : -1));

	const labels = mapping.map((m) => m.label);
	const rawValues = mapping.map((m) => m.value);

	// Scale bigints down to safe JS numbers for charting; scale factor doesn't matter for percentages
	const series = rawValues.map((v) => Math.max(0, Math.floor(parseFloat(formatUnits(v, 18)))));
	const total = rawValues.reduce((a, b) => a + b, 0n);

	const percentByLabel = new Map<string, number>();
	labels.forEach((label, idx) => {
		const v = rawValues[idx];
		const pct = total === 0n ? 0 : Number((v * 1000n) / total) / 10;
		percentByLabel.set(label, pct);
	});

	useEffect(() => {
		const fetcher = async () => {
			const vchf = await readContract(WAGMI_CONFIG, {
				chainId: mainnet.id,
				address: ADDRESS[mainnet.id].stablecoinBridgeVCHF,
				abi: StablecoinBridgeABI,
				functionName: "minted",
			});
			setSwapBridgeVCHF(vchf);
		};
		fetcher();
	}, []);

	return (
		<div className="grid md:grid-cols-2 gap-4">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Frankencoins by Origin</div>

				<div className="-m-4 pr-2">
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
								formatter: (val: number) => `${Math.round(Number(val))}%`,
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value / 100000) / 10} Mio. ZCHF`;
									},
								},
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
												label: "Total",
												formatter: () => `${labels.length} collaterals`,
											},
										},
									},
								},
							},
						}}
						series={series}
					/>

					{labels.length == 0 ? <div className="flex justify-center text-text-warning">No data available.</div> : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Frankencoins by Origin</div>

				<div className="mt-4 space-y-1">
					{labels.map((label, idx) => (
						<div key={`${label}_${idx}`} className="flex justify-between">
							<div className="text-text-secondary font-semibold" style={{ color: colors[idx % colors.length] }}>
								{label} <span className="text-sm">({percentByLabel.get(label)}%)</span>
							</div>
							<div className="text-text-secondary font-semibold">{formatCurrency(series[idx].toString(), 2)} ZCHF</div>
						</div>
					))}
					<div className="flex justify-between">
						<div className="text-text-primary font-semibold mt-2">
							Total <span className="text-sm">(100%)</span>
						</div>
						<div className="text-text-primary font-semibold mt-2">{formatCurrency(formatUnits(total, 18), 2)} ZCHF</div>
					</div>
				</div>
			</AppCard>
		</div>
	);
}
