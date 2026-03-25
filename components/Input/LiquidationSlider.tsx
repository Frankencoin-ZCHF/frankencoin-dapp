import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	label?: string;
	value: number; // current liquidation price (ZCHF per collateral token, float)
	min: number; // minimum selectable price
	max: number; // maximum allowed price (position's price limit)
	marketPrice: number; // market price shown as reference
	onChange: (value: number) => void;
	symbol?: string;
	disabled?: boolean;
	error?: string;
	warning?: string;
	note?: string;
	limit?: bigint;
	limitDigit?: bigint | number;
	limitLabel?: string;
}

export default function LiquidationSlider({
	label,
	value,
	min,
	max,
	marketPrice,
	onChange,
	symbol = "ZCHF",
	disabled,
	error,
	warning,
	note,
	limit = 0n,
	limitDigit = 18n,
	limitLabel,
}: Props) {
	// Pin the "Max" marker at 80% of the track; derive the track's right-end accordingly
	const trackEnd = (max - min) / 0.8 + min;
	const scale = Math.max(trackEnd - min, 1);
	const valuePct = Math.min(100, Math.max(0, ((value - min) / scale) * 100));
	const maxPct = 80;

	return (
		<div>
			<div
				className={`group border-card-input-border ${
					disabled ? "bg-card-input-disabled" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus text-text-secondary border-2 rounded-lg px-3 py-1`}
			>
				{/* Label row */}
				<div className="flex items-center my-1">
					<span className="flex-1 text-card-input-label">{label ?? "Liquidation price"}</span>
					<span className="font-bold text-text-primary">
						{formatCurrency(value)} {symbol}
					</span>
				</div>

				{/* Slider area */}
				<div className="relative" style={{ paddingTop: "1rem", paddingBottom: "0.5rem" }}>
					{/* Max marker label above track */}
					<div className="absolute top-2 text-xs font-bold text-red-500 -translate-x-1/2" style={{ left: `${maxPct}%` }}>
						Max
					</div>

					{/* Track + thumb container */}
					<div className="relative h-8 flex items-center">
						{/* Gradient track */}
						<div
							className="absolute inset-x-0 h-3 rounded-full"
							style={{
								background: `linear-gradient(to right, #22c55e 0%, #eab308 40%, #f97316 ${maxPct}%, #d1d5db ${maxPct}%, #d1d5db 100%)`,
							}}
						>
							{/* Max line marker */}
							<div className="absolute top-0 bottom-0 w-0.5 bg-white/70" style={{ left: `${maxPct}%` }} />
						</div>

						{/* Thumb */}
						<div
							className="absolute w-5 h-5 rounded-full bg-white border-2 border-gray-300 shadow-md pointer-events-none -translate-x-1/2"
							style={{ left: `${valuePct}%` }}
						/>

						{/* Invisible native range input for event handling */}
						<input
							type="range"
							className="absolute inset-0 w-full opacity-0 cursor-pointer"
							min={min}
							max={trackEnd}
							step={(trackEnd - min) / 1000}
							value={value}
							disabled={disabled}
							onChange={(e) => {
								const v = Math.min(parseFloat(e.target.value), max);
								onChange(v);
							}}
						/>
					</div>
				</div>

				{/* Bottom row */}
				<div className="flex flex-row gap-2 py-1">
					<div className="flex flex-row gap-2 flex-1">
						{limitLabel != undefined && (
							<>
								<div className="text-text-secondary flex-shrink-0">{limitLabel}</div>
								<div className="text-text-primary truncate min-w-0 overflow-hidden">
									{formatCurrency(formatUnits(limit, Number(limitDigit)))}
								</div>
							</>
						)}
					</div>
					<div className="flex flex-row gap-2">
						<span className="text-text-secondary flex-shrink-0">Market</span>
						<span className="text-text-primary">{formatCurrency(marketPrice)}</span>
					</div>
				</div>
			</div>

			{error ? (
				<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
			) : warning ? (
				<div className="flex my-2 px-3.5 text-amber-500">{warning}</div>
			) : (
				<div className="flex my-2 px-3.5">{note}</div>
			)}
		</div>
	);
}
