import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AppCard from "../AppCard";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { formatCurrency, FormatType } from "../../utils/format";
import { colors } from "../../utils/constant";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Fields added with API 0.4.4 are optional so the section keeps working against an older API.
type Earnings = {
	minterProposalFees: number;
	investFees: number;
	redeemFees: number;
	fcsRedemptionFees?: number;
	positionProposalFees: number;
	challengeProfits?: number;
	forcedSaleProfits?: number;
	otherProfitClaims: number;
	otherContributions: number;
	savingsInterestCosts: number;
	challengeLosses?: number;
	forcedSaleLosses?: number;
	otherLossClaims: number;
};

type Item = { label: string; value: number; hideIfZero?: boolean }; // costs are negative
type Category = { label: string; items: Item[]; total: number };

const byValueDesc = (a: { value: number }, b: { value: number }) => b.value - a.value;

// values that display as 0.00 (or -0.00) are treated as zero
const isZero = (value: number) => Math.abs(value) < 0.005;

function category(label: string, items: Item[]): Category {
	const sorted = items.filter((i) => !(i.hideIfZero && isZero(i.value))).sort(byValueDesc);
	return { label, items: sorted, total: sorted.reduce((a, i) => a + i.value, 0) };
}

export function buildRevenue(e: Earnings | null): Category[] {
	if (!e) return [];
	// the Other line is a residual: hide it while its value (shown as a negative) is still larger than -1 ZCHF
	const hasOtherLosses = -e.otherLossClaims <= -1;
	return [
		category("Trading Revenue", [
			{ label: "Invest Spread", value: e.investFees },
			{ label: "Redeem Spread", value: e.redeemFees },
			{ label: "Discount Spread", value: e.fcsRedemptionFees ?? 0 },
		]),
		category("Interest Revenue", [
			// includes all profit claims not attributed elsewhere, mainly position interest
			{ label: "Interest Claims", value: e.otherProfitClaims },
			{ label: "Interest Spend", value: -e.savingsInterestCosts },
		]),
		category("Challenge Revenue", [
			{ label: "Challenge Profits", value: e.challengeProfits ?? 0 },
			{ label: "Challenge Losses", value: -(e.challengeLosses ?? 0) },
			{ label: "Forced Sale Profits", value: e.forcedSaleProfits ?? 0, hideIfZero: true },
			{ label: "Forced Sale Losses", value: -(e.forcedSaleLosses ?? 0), hideIfZero: true },
		]),
		category("Proposal Revenue", [
			{ label: "Position Proposals", value: e.positionProposalFees },
			{ label: "Minter Proposals", value: e.minterProposalFees },
		]),
		...(hasOtherLosses ? [category("Other", [{ label: "Other Loss Claims", value: -e.otherLossClaims }])] : []),
	].sort((a, b) => b.total - a.total);
}

export function useFpsEarnings() {
	const [earnings, setEarnings] = useState<Earnings | null>(null);

	useEffect(() => {
		FRANKENCOIN_API_CLIENT.get<Earnings>("/analytics/fps/earnings")
			.then((res) => setEarnings(res.data))
			.catch((e) => console.error("Failed to load FPS earnings", e));
	}, []);

	return earnings;
}

const fmt = (v: number) => `${formatCurrency(v, 2, 2, FormatType.symbol)} ZCHF`;

export function RevenueAllocation() {
	const earnings = useFpsEarnings();
	const categories = buildRevenue(earnings);
	const total = categories.reduce((a, c) => a + c.total, 0);

	// a donut cannot show negative slices, so only categories with positive revenue are drawn
	const slices = categories.filter((c) => c.total > 0);

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
							labels: slices.map((c) => c.label),
							dataLabels: {
								enabled: true,
								formatter: (val: number) => `${Math.round(Number(val))}%`,
							},
							legend: { show: false },
							plotOptions: {
								pie: {
									donut: {
										labels: {
											show: true,
											total: {
												show: true,
												label: "Net Revenue",
												formatter: () => fmt(total),
											},
										},
									},
								},
							},
						}}
						series={slices.map((c) => Math.round(c.total))}
					/>
					{categories.length === 0 ? <div className="flex justify-center text-text-warning">No data available.</div> : null}
				</div>

				<div className="my-auto space-y-3">
					{categories.map((c) => {
						const idx = slices.findIndex((s) => s.label === c.label);
						return (
							<div key={c.label}>
								<div className="flex justify-between">
									<div
										className="font-semibold text-text-primary"
										style={idx >= 0 ? { color: colors[idx % colors.length] } : undefined}
									>
										{c.label}
									</div>
									<div className="font-semibold text-text-primary">{fmt(c.total)}</div>
								</div>
								{c.items.map((i) => (
									<div key={i.label} className="flex justify-between pl-4 text-sm text-text-secondary">
										<div>{i.label}</div>
										<div>{fmt(i.value)}</div>
									</div>
								))}
							</div>
						);
					})}
					<div className="flex justify-between border-t border-text-secondary/20 pt-2">
						<div className="text-text-primary font-semibold">Net Revenue</div>
						<div className="text-text-primary font-semibold">{fmt(total)}</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
