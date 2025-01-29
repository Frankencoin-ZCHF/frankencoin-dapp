import DisplayAmount from "../DisplayAmount";
import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	label?: string;
	symbol: string;
	placeholder?: string;
	balanceLabel?: string;
	min?: bigint;
	max?: bigint;
	reset?: bigint;
	digit?: bigint | number;
	hideMaxLabel?: boolean;
	limit?: bigint;
	limitLabel?: string;
	output?: string;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
	disabled?: boolean;
	error?: string;
}

export default function TokenInput({
	label = "Send",
	placeholder = "Input Amount",
	symbol,
	min,
	max,
	reset,
	digit = 18n,
	limit = 0n,
	limitLabel,
	output,
	note,
	value = "0",
	disabled,
	onChange = () => {},
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
	error,
}: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1 text-text-secondary">
				<div className="flex-1 ">{label}</div>

				<div className="flex flex-row gap-2 font-semibold text-sm text-text-primary cursor-pointer">
					{max != undefined && (
						<div
							className="p-1 rounded-xl bg-card-input-max hover:bg-card-input-hover"
							onClick={() => {
								if (max !== undefined) {
									onChange(max.toString());
									onMax();
								}
							}}
						>
							max
						</div>
					)}

					{min != undefined && (
						<div
							className="p-1 rounded-xl bg-card-input-min hover:bg-card-input-hover"
							onClick={() => {
								if (min !== undefined) {
									onChange(min.toString());
									onMin();
								}
							}}
						>
							min
						</div>
					)}

					{reset != undefined && reset != BigInt(value) && (
						<div
							className="p-1 rounded-xl bg-card-input-reset hover:bg-card-input-hover"
							onClick={() => {
								if (reset !== undefined) {
									onChange(reset.toString());
									onReset();
								}
							}}
						>
							reset
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<div className="mr-4">
					<TokenLogo currency={symbol} size={10} />
				</div>
				<div className="flex-1">
					{output ? (
						<div className="px-3 py-2 font-bold transition-opacity">{output}</div>
					) : (
						<div
							className={`flex gap-1 rounded-lg p-1 bg-card-content-secondary border-2 ${
								error ? "border-text-warning" : "focus-within:border-card-input-focus"
							} ${disabled ? "bg-card-body-primary text-text-header" : ""}`}
						>
							<BigNumberInput
								autofocus={true}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value}
								onChange={(e) => onChange?.(e)}
								className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg`}
								disabled={disabled}
							/>
						</div>
					)}
				</div>

				<div className="hidden w-20 px-4 text-end font-bold sm:block">{symbol}</div>
			</div>
			{error && <div className="mt-2 px-1 text-text-warning">{error}</div>}
			<div className="mt-2 px-1 flex items-center">
				{limit >= 0n && limitLabel && (
					<>
						<span>{limitLabel} :&nbsp;</span>
						<DisplayAmount amount={limit} currency={symbol} />
					</>
				)}
				{note && <span>{note}</span>}
			</div>
		</div>
	);
}
