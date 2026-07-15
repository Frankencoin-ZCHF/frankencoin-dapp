import dynamic from "next/dynamic";
import { Address, formatUnits } from "viem";
import { useConnection } from "wagmi";
import AppCard from "@components/AppCard";
import { AmplifierPriceView, AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import { FormatType, formatCurrency, shortenAddress } from "@utils";
import { getAmountsForLiquidity, getSqrtRatioAtTick } from "../../utils/uniswapV3Math";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const OWN_COLOR = "#0F80F0"; // highlight: positions of the acting account
const OTHER_COLOR = "#6B7280"; // de-emphasized context: everyone else's positions
const PRICE_COLOR = "#F59E0B";
const ANCHOR_COLOR = "#9CA3AF";

interface Props {
	stats: AmplifierStats;
	priceView: AmplifierPriceView;
	positions: AmplifiedPositionInfo[];
	overwrite?: Address;
}

type Block = {
	address: Address;
	isOwn: boolean;
	low: number; // price range in the displayed orientation
	high: number;
	value: number; // total capital at the current price, in the displayed denomination
	density: number; // value per unit of price, i.e. the block's height
};

/**
 * Visualizes how the pool's amplified liquidity is distributed over the price range.
 * Each position is a block: its width is the position's price range and its height the
 * capital per unit of price, so the block's area equals the position's total value in
 * ZCHF. Blocks are stacked with the largest positions at the bottom.
 */
export default function AmplifierPoolChart({ stats, priceView, positions, overwrite }: Props) {
	const { address: connected } = useConnection();
	const account = (overwrite ?? connected)?.toLowerCase();
	const priceUnit = priceView.unit;
	// capital follows the price denominator: ZCHF amounts on a ZCHF/USD axis, USD on a USD/ZCHF axis
	const valueUnit = priceView.inverted ? stats.usdSymbol || "USD" : stats.zchfSymbol;

	const blocks: Block[] = positions
		.filter((position) => position.liquidity > 0n && stats.sqrtPriceX96 > 0n && stats.pricePerUsd > 0)
		.map((position) => {
			const sqrtA = getSqrtRatioAtTick(position.tickLow);
			const sqrtB = getSqrtRatioAtTick(position.tickHigh);
			const amounts = getAmountsForLiquidity(stats.sqrtPriceX96, sqrtA, sqrtB, position.liquidity, false);
			const usdAmount = stats.zchfIsToken0 ? amounts.amount1 : amounts.amount0;
			const zchfAmount = stats.zchfIsToken0 ? amounts.amount0 : amounts.amount1;
			const zchfValue = Number(formatUnits(zchfAmount, 18)) + Number(formatUnits(usdAmount, stats.usdDecimals)) * stats.pricePerUsd;
			const value = priceView.inverted ? zchfValue * stats.usdPerZchf : zchfValue;
			const priceAtLow = priceView.atTick(position.tickLow);
			const priceAtHigh = priceView.atTick(position.tickHigh);
			const low = Math.min(priceAtLow, priceAtHigh);
			const high = Math.max(priceAtLow, priceAtHigh);
			return {
				address: position.address,
				isOwn: !!account && position.owner.toLowerCase() === account,
				low,
				high,
				value,
				density: high > low ? value / (high - low) : 0,
			};
		})
		.filter((block) => block.value > 0 && block.density > 0)
		.sort((a, b) => b.value - a.value); // stacked in series order, so the largest ends up at the bottom

	if (blocks.length === 0) return null;

	// breakpoints at every block edge; the step series hold their value until the next breakpoint.
	// A dense, even grid is mixed in because Apex renders numeric x axes unreliably with only a
	// handful of unevenly spaced data points.
	const edges = blocks.flatMap((block) => [block.low, block.high]);
	// the x axis always covers the amplifier's full allowed price range, even when the
	// actual positions only occupy a narrow part of it
	const bounds = [priceView.atTick(stats.minimumTick), priceView.atTick(stats.maximumTick)];
	const markers = [priceView.current, priceView.anchor, ...bounds].filter((price) => price > 0);
	const span = Math.max(...edges, ...markers) - Math.min(...edges, ...markers);
	const pad = span > 0 ? span * 0.05 : Math.max(...edges) * 0.01;
	const xMin = Math.min(...edges, ...markers) - pad;
	const xMax = Math.max(...edges, ...markers) + pad;
	const grid = Array.from({ length: 61 }, (_, i) => xMin + ((xMax - xMin) * i) / 60);
	const xs = Array.from(new Set([...grid, ...edges])).sort((a, b) => a - b);

	// Apex garbles numeric x-axis labels when the values span less than ~1 (all ticks collapse
	// to the minimum), so the data is plotted at a scaled-up x and scaled back in the labels
	const xScale = Math.pow(10, Math.max(0, Math.ceil(2 - Math.log10(xMax - xMin))));

	// Apex does not support numeric x axes on stacked charts, so the stacking is done manually:
	// series i is the cumulative density of the blocks up to i, drawn back to front (the total
	// first) with opaque fills, so each block remains visible as the band it adds to the stack.
	const densityAt = (block: Block, x: number) => (x >= block.low && x < block.high ? block.density : 0);
	const cumulative = blocks.map((_, i) => ({
		name: shortenAddress(blocks[i].address),
		data: xs.map((x) => [x * xScale, blocks.slice(0, i + 1).reduce((sum, block) => sum + densityAt(block, x), 0)] as [number, number]),
	}));
	const series = cumulative.slice().reverse();
	const seriesColors = blocks.map((block) => (block.isOwn ? OWN_COLOR : OTHER_COLOR)).reverse();

	const hasOwn = blocks.some((block) => block.isOwn);
	const hasOther = blocks.some((block) => !block.isOwn);

	const formatPrice = (value: number) => formatCurrency(value, 2, 4, FormatType.us);
	const formatYLabel = (value: number) =>
		value >= 1_000_000
			? `${(value / 1_000_000).toFixed(1)}M`
			: value >= 1_000
			? `${Math.round(value / 1_000)}k`
			: `${Math.round(value)}`;

	return (
		<AppCard>
			<div>
				<div className="text-lg font-bold text-center">Liquidity Distribution</div>
				<div className="mt-2 text-text-secondary">
					Each block is a position: its width is the position&apos;s price range and its area the position&apos;s current value in{" "}
					{valueUnit}. The largest positions are at the bottom.
				</div>
			</div>

			<div className="flex flex-row justify-center gap-6 text-sm text-text-secondary">
				{hasOwn && (
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-sm" style={{ backgroundColor: OWN_COLOR }}></span>
						Your positions
					</div>
				)}
				{hasOther && (
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-sm" style={{ backgroundColor: OTHER_COLOR }}></span>
						{hasOwn ? "Other positions" : "Positions"}
					</div>
				)}
			</div>

			<div className="-mx-2">
				<ApexChart
					type="area"
					height={300}
					options={{
						chart: {
							type: "area",
							toolbar: { show: false },
							zoom: { enabled: false },
							background: "transparent",
							animations: { enabled: false },
							parentHeightOffset: 0,
						},
						colors: seriesColors,
						stroke: { curve: "stepline", width: 1.5, colors: ["#FFFFFF"] },
						fill: { type: "solid", opacity: 1 },
						dataLabels: { enabled: false },
						legend: { show: false },
						grid: {
							borderColor: "#E5E7EB",
							xaxis: { lines: { show: false } },
							yaxis: { lines: { show: true } },
							padding: { left: 8, right: 16 },
						},
						xaxis: {
							type: "numeric",
							tickAmount: 6,
							labels: {
								formatter: (value: string) => formatPrice(Number(value) / xScale) ?? "",
								style: { colors: "#6B7280", fontSize: "11px" },
							},
							axisBorder: { show: false },
							axisTicks: { show: false },
							title: { text: priceUnit, style: { color: "#6B7280", fontSize: "12px", fontWeight: 400 } },
						},
						yaxis: {
							min: 0,
							labels: {
								formatter: formatYLabel,
								style: { colors: "#6B7280", fontSize: "11px" },
							},
							title: {
								text: `Capital Density (${valueUnit} per unit of price)`,
								style: { color: "#6B7280", fontSize: "12px", fontWeight: 400 },
							},
						},
						annotations: {
							xaxis: [
								{
									x: priceView.current * xScale,
									borderColor: PRICE_COLOR,
									strokeDashArray: 0,
									label: {
										text: `Current ${formatPrice(priceView.current)}`,
										borderColor: PRICE_COLOR,
										orientation: "horizontal",
										style: { color: "#FFFFFF", background: PRICE_COLOR, fontSize: "11px" },
									},
								},
								...(priceView.anchor > 0
									? [
											{
												x: priceView.anchor * xScale,
												borderColor: ANCHOR_COLOR,
												strokeDashArray: 4,
												label: {
													text: `Anchor ${formatPrice(priceView.anchor)}`,
													borderColor: ANCHOR_COLOR,
													orientation: "horizontal",
													offsetY: 20,
													style: { color: "#FFFFFF", background: ANCHOR_COLOR, fontSize: "11px" },
												},
											},
									  ]
									: []),
							],
						},
						tooltip: {
							shared: true,
							intersect: false,
							custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
								const x = xs[dataPointIndex];
								const rows = blocks
									.map((block) => {
										if (densityAt(block, x) <= 0) return "";
										return `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
											<span style="width:8px;height:8px;border-radius:2px;background:${block.isOwn ? OWN_COLOR : OTHER_COLOR};"></span>
											<span>${shortenAddress(block.address)}</span>
											<span style="margin-left:auto;padding-left:12px;font-weight:500;">${formatCurrency(block.value, 0, 0, FormatType.us)} ${valueUnit}</span>
										</div>`;
									})
									.join("");
								const header = `${formatPrice(x)} ${priceUnit}`;
								return `<div style="padding:8px 12px;font-size:12px;min-width:200px;">
									<div style="font-weight:600;margin-bottom:4px;">${header}</div>
									${rows || `<div style="color:#6B7280;">No liquidity at this price</div>`}
								</div>`;
							},
						},
					}}
					series={series}
				/>
			</div>
		</AppCard>
	);
}
