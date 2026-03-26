import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	label?: string;
	value: number; // current liquidation price (ZCHF per collateral token, float)
	sliderMin: number; // left edge of the slider track
	sliderMax: number; // right edge of the slider track
	sliderSource: number; // "source" marker position (true value)
	min?: number; // "Min" button target value
	max?: number; // "Max" button target value
	reset?: number; // "Reset" button target value
	onChange: (value: number) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
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
	sliderMin,
	sliderMax,
	sliderSource,
	min,
	max,
	reset,
	onChange,
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
	symbol = "ZCHF",
	disabled,
	error,
	warning,
	note,
	limit = 0n,
	limitDigit = 18n,
	limitLabel,
}: Props) {
	const scale = Math.max(sliderMax - sliderMin, 1e-10);
	const valuePct = Math.min(100, Math.max(0, ((value - sliderMin) / scale) * 100));
	const sourcePct = Math.min(100, Math.max(0, ((sliderSource - sliderMin) / scale) * 100));

	const canShowButtons = !disabled;

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
					<span className="font-bold text-lg text-text-primary">
						{formatCurrency(value)} {symbol}
					</span>
				</div>

				{/* Slider area */}
				<div className="relative" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
					{/* Source marker label above track */}
					<div className="absolute -top-1 text-xs font-bold text-orange-400 -translate-x-1/2" style={{ left: `${sourcePct}%` }}>
						Reference
					</div>

					{/* Track + thumb container */}
					<div className="relative h-8 flex items-center">
						{/* Gradient track */}
						<div className="absolute inset-x-0 h-3 rounded-full overflow-hidden">
							{/* Full risk gradient spanning 0–100% of track */}
							<div
								className="absolute inset-0"
								style={{ background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #f97316 100%)` }}
							/>
							{/* Grey cover from source marker to end */}
							<div className="absolute top-0 bottom-0 bg-gray-300" style={{ left: `${sourcePct}%`, right: 0 }} />
							{/* Source line marker */}
							<div className="absolute top-0 bottom-0 w-0.5 bg-white/70" style={{ left: `${sourcePct}%` }} />
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
							min={sliderMin}
							max={sliderMax}
							step={(sliderMax - sliderMin) / 1000}
							value={value}
							disabled={disabled}
							onChange={(e) => onChange(parseFloat(e.target.value))}
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
						{canShowButtons && max != undefined && max !== value && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									onChange(max);
									onMax();
								}}
							>
								Max
							</div>
						)}
						{canShowButtons && min != undefined && min !== value && min !== max && (
							<div
								className="text-card-input-min cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									onChange(min);
									onMin();
								}}
							>
								Min
							</div>
						)}
						{canShowButtons && reset != undefined && reset !== value && reset !== min && reset !== max && (
							<div
								className="text-card-input-reset cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									onChange(reset);
									onReset();
								}}
							>
								Reset
							</div>
						)}
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
