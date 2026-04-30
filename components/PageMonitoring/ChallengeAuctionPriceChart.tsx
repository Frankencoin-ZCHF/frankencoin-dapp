import dynamic from "next/dynamic";
import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";
import { formatCurrency, formatDateTime } from "@utils";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {
	position: PositionQuery;
	challengeStartMs: number;
	phase1Ms: number;
	phase2Ms: number;
	auctionPrice?: bigint;
	marketPrice?: bigint;
}

export default function ChallengeAuctionPriceChart({ position, challengeStartMs, phase1Ms, phase2Ms, auctionPrice, marketPrice }: Props) {
	const priceDigits = 36 - position.collateralDecimals;
	const liqPriceNum = parseFloat(formatUnits(BigInt(position.price), priceDigits));
	const currentPriceNum = auctionPrice !== undefined ? parseFloat(formatUnits(auctionPrice, priceDigits)) : undefined;
	const marketPriceNum = marketPrice ? parseFloat(formatUnits(marketPrice, priceDigits)) : undefined;

	const nowMs = Date.now();
	const auctionEndMs = challengeStartMs + phase1Ms + phase2Ms;

	const isLive = nowMs > challengeStartMs && nowMs < auctionEndMs;

	const STEPS = 60;

	const phase1Data: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => {
		const t = i / STEPS;
		return [challengeStartMs + t * phase1Ms, liqPriceNum];
	});

	const phase2Data: [number, number][] = Array.from({ length: STEPS + 1 }, (_, i) => {
		const t = i / STEPS;
		return [challengeStartMs + phase1Ms + t * phase2Ms, liqPriceNum * (1 - t)];
	});

	// Calculate when auction price crosses market price
	// Phase 1 is flat at liqPriceNum — market price can only be hit in Phase 2 where price < liqPriceNum
	let marketPriceHitMs: number | undefined;
	if (marketPriceNum !== undefined && isLive) {
		if (marketPriceNum <= liqPriceNum && marketPriceNum > 0) {
			const ratio = 1 - marketPriceNum / liqPriceNum;
			marketPriceHitMs = challengeStartMs + phase1Ms + ratio * phase2Ms;
		}
	}

	const yaxisAnnotations = [
		...(marketPriceNum !== undefined
			? [
					{
						y: marketPriceNum,
						borderColor: "#16A34A",
						borderWidth: 1.5,
						strokeDashArray: 5,
						label: {
							text: `Market ${formatCurrency(marketPriceNum, 0, 0)}`,
							position: "left",
							offsetX: 65,
							style: {
								color: "#16A34A",
								background: "transparent",
								fontSize: "10px",
								padding: { top: 2, bottom: 2, left: 4, right: 4 },
							},
						},
					},
			  ]
			: []),
	];

	const pointAnnotations: object[] = [];

	if (isLive && auctionPrice !== undefined && auctionPrice > 0n && currentPriceNum !== undefined) {
		pointAnnotations.push({
			x: nowMs,
			y: currentPriceNum,
			marker: { size: 8, fillColor: "#F59E0B", strokeColor: "#fff", strokeWidth: 2 },
			label: {
				text: `${formatCurrency(currentPriceNum, 0, 0)} ZCHF`,
				borderColor: "#F59E0B",
				offsetY: -6,
				style: { color: "#fff", background: "#F59E0B", fontSize: "11px", padding: { top: 3, bottom: 3, left: 6, right: 6 } },
			},
		});
	}

	if (marketPriceHitMs && marketPriceNum !== undefined) {
		pointAnnotations.push({
			x: marketPriceHitMs,
			y: marketPriceNum,
			marker: { size: 8, fillColor: "#16A34A", strokeColor: "#fff", strokeWidth: 2 },
			label: {
				text: `Hit ${formatDateTime(marketPriceHitMs / 1000) || ""}`,
				borderColor: "#16A34A",
				offsetY: -6,
				style: { color: "#fff", background: "#16A34A", fontSize: "11px", padding: { top: 3, bottom: 3, left: 6, right: 6 } },
			},
		});
	}

	const formatXLabel = (val: string) => {
		const d = new Date(Number(val));
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${months[d.getMonth()]} ${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
	};

	const formatYLabel = (val: number) => {
		if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
		return `${formatCurrency(val, 0, 0)}`;
	};

	return (
		<div className="-mx-4 -mt-2">
			<ApexChart
				type="area"
				height={340}
				options={{
					chart: {
						type: "area",
						toolbar: { show: false },
						zoom: { enabled: false },
						background: "transparent",
						animations: { enabled: false },
						parentHeightOffset: 0,
					},
					colors: ["#2563EB", "#EF4444"],
					stroke: { curve: "straight", width: [2.5, 2.5] },
					dataLabels: { enabled: false },
					fill: {
						type: "gradient",
						gradient: {
							shadeIntensity: 0,
							opacityFrom: 0.4,
							opacityTo: 0.05,
							shade: "light",
							gradientToColors: ["#2563EB", "#EF4444"],
						},
					},
					grid: {
						borderColor: "#E5E7EB",
						xaxis: { lines: { show: true } },
						yaxis: { lines: { show: true } },
						padding: { left: 8, right: 16 },
					},
					xaxis: {
						type: "datetime",
						labels: {
							formatter: formatXLabel,
							style: { colors: "#6B7280", fontSize: "11px" },
							rotate: -20,
							rotateAlways: false,
						},
						axisBorder: { show: false },
						axisTicks: { show: false },
					},
					yaxis: {
						min: 0,
						max: (max) => Math.round(2 * max),
						title: {
							text: "Bid Price (ZCHF)",
							style: { color: "#6B7280", fontSize: "12px", fontWeight: 400 },
						},
						labels: {
							formatter: formatYLabel,
							style: { colors: "#6B7280", fontSize: "11px" },
						},
					},
					legend: {
						show: true,
						position: "top",
						horizontalAlign: "center",
						labels: { colors: "#374151" },
						fontSize: "12px",
						markers: { size: 6 },
						itemMargin: { horizontal: 12 },
					},
					annotations: {
						yaxis: yaxisAnnotations,
						points: pointAnnotations,
					},
					tooltip: {
						x: { formatter: (val: number) => formatDateTime(val / 1000) || "" },
						y: { formatter: (val: number) => `${formatCurrency(val, 2, 2)} ZCHF` },
					},
				}}
				series={[
					{ name: "Phase 1  (1× fixed)", data: phase1Data },
					{ name: "Phase 2  (1× → 0)", data: phase2Data },
				]}
			/>
		</div>
	);
}
