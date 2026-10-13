import { useEffect, useRef } from "react";
import { PositionQueryV2 } from "@frankencoin/api";
import { formatUnits } from "viem";
import { track } from "@hooks";
import { formatCurrency } from "@utils";

export type LeveragePositionOption = {
	position: PositionQueryV2;
	leverage: number;
};

interface Props {
	options: LeveragePositionOption[];
	selected: string;
	onSelect: (position: string) => void;
}

/**
 * Selectable cards for the positions of one collateral, from the lowest leverage on the left
 * to the highest on the right. Each card shows what differs between positions.
 */
export default function LeveragePositionTabs({ options, selected, onSelect }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedRef = useRef<HTMLButtonElement>(null);

	// bring the selected card into view, only the row scrolls, never the page
	useEffect(() => {
		const container = containerRef.current;
		const card = selectedRef.current;
		if (!container || !card) return;
		container.scrollLeft = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
	}, [selected, options.length]);

	return (
		<div ref={containerRef} className="relative flex gap-4 overflow-x-auto pb-1">
			{options.map(({ position: p, leverage }) => {
				const isActive = p.position === selected;
				const price = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				const reserve = p.reserveContribution / 10 ** 4;
				const interest = p.annualInterestPPM / 10 ** 4;
				const effective = interest / (1 - reserve / 100);
				const minColl = parseFloat(formatUnits(BigInt(p.minimumCollateral), p.collateralDecimals));

				return (
					<button
						key={p.position}
						ref={isActive ? selectedRef : undefined}
						type="button"
						onClick={() => {
							track("leverage_position");
							onSelect(p.position);
						}}
						className={`w-44 shrink-0 flex flex-col gap-3 rounded-lg bg-card-body-primary p-4 text-left border-2 transition-colors ${
							isActive ? "border-card-input-focus" : "border-transparent hover:border-card-input-hover"
						}`}
					>
						<div className={`text-2xl font-bold ${isActive ? "text-purple-400" : "text-text-primary"}`}>
							{leverage > 0 ? `${formatCurrency(leverage, 2, 2)}×` : "No leverage"}
						</div>

						<div className="flex flex-col gap-2 text-sm">
							<Stat label="Price" value={`${formatCurrency(price)} ZCHF`} />
							<Stat label="Interest" value={`${formatCurrency(effective, 2, 2)}%`} />
							<Stat label="Reserve" value={`${formatCurrency(reserve, 0, 2)}%`} />
							<Stat label="Min. collateral" value={`${formatCurrency(minColl, 0, 4)} ${p.collateralSymbol}`} />
						</div>
					</button>
				);
			})}

			<div className="w-44 shrink-0 flex items-center justify-center rounded-lg border-2 border-dashed border-card-input-border p-4 text-sm text-text-secondary">
				Future terms
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<span className="text-text-secondary">{label}</span>
			<span className="font-semibold text-text-primary">{value}</span>
		</div>
	);
}
