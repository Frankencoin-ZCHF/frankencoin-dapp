import { useState } from "react";
import { formatCurrency } from "@utils";

export interface AppRingChartRing {
	label: string; // e.g. "Votes", shown in the center on hover
	values: number[]; // one value per category, in any unit — each ring is normalized to its own total
}

interface Props {
	categories: string[];
	colors: (string | undefined)[]; // one color per category; undefined leaves that part of the ring empty
	rings: AppRingChartRing[]; // outermost first
	centerLabel?: string;
	centerValue?: string;
	size?: number;
}

const VIEWBOX = 200;
const THICKNESS = 22;
const GAP = 6;

/**
 * Concentric donut chart: one ring per series, all sharing the same categories and colors.
 * Useful for comparing two distributions of the same categories, e.g. votes vs. supply.
 * Leaving all but one color undefined turns each ring into a progress indicator for that category.
 */
export default function AppRingChart({ categories, colors, rings, centerLabel, centerValue, size = 280 }: Props) {
	const [hovered, setHovered] = useState<{ ring: number; category: number } | undefined>();

	const shareOf = (ring: AppRingChartRing, idx: number) => {
		const total = ring.values.reduce((a, b) => a + b, 0);
		return total > 0 ? (ring.values[idx] / total) * 100 : 0;
	};

	const hoveredRing = hovered ? rings[hovered.ring] : undefined;

	return (
		<div className="relative mx-auto" style={{ width: size, height: size }}>
			<svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size} height={size} className="-rotate-90">
				{rings.map((ring, r) => {
					const radius = VIEWBOX / 2 - THICKNESS / 2 - r * (THICKNESS + GAP);
					const circumference = 2 * Math.PI * radius;
					let offset = 0;

					return (
						<g key={ring.label}>
							{/* track, visible wherever the ring is not filled */}
							<circle
								cx={VIEWBOX / 2}
								cy={VIEWBOX / 2}
								r={radius}
								fill="none"
								stroke="currentColor"
								strokeOpacity={0.1}
								strokeWidth={THICKNESS}
							/>
							{ring.values.map((_, c) => {
								const length = (shareOf(ring, c) / 100) * circumference;
								const dashOffset = -offset;
								offset += length;
								const color = colors[c % colors.length];
								if (length <= 0 || !color) return null;
								const isHovered = hovered?.ring === r && hovered?.category === c;

								return (
									<circle
										key={c}
										cx={VIEWBOX / 2}
										cy={VIEWBOX / 2}
										r={radius}
										fill="none"
										stroke={color}
										strokeWidth={isHovered ? THICKNESS + 4 : THICKNESS}
										strokeDasharray={`${length} ${circumference - length}`}
										strokeDashoffset={dashOffset}
										className="cursor-pointer transition-[stroke-width]"
										onMouseEnter={() => setHovered({ ring: r, category: c })}
										onMouseLeave={() => setHovered(undefined)}
									/>
								);
							})}
						</g>
					);
				})}
			</svg>

			{/* center: hovered segment, or the default label */}
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-16">
				{hovered && hoveredRing ? (
					<>
						<div className="text-xs text-text-secondary">{hoveredRing.label}</div>
						<div className="text-sm font-semibold" style={{ color: colors[hovered.category % colors.length] }}>
							{categories[hovered.category]}
						</div>
						<div className="text-xl font-bold text-text-primary">
							{formatCurrency(shareOf(hoveredRing, hovered.category), 0, 2)}%
						</div>
					</>
				) : (
					<>
						{centerLabel && <div className="text-sm text-text-secondary">{centerLabel}</div>}
						{centerValue && <div className="text-lg font-bold text-text-primary">{centerValue}</div>}
					</>
				)}
			</div>
		</div>
	);
}
