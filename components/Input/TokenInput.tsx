import { formatUnits } from "viem";
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
	limitDigit?: bigint | number;
	limitLabel?: string;
	output?: string;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
	autoFocus?: boolean;
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
	limitDigit = 18n,
	limitLabel,
	output,
	note,
	value = "0",
	autoFocus,
	disabled,
	onChange = () => {},
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
	error,
}: Props) {
	return (
		<div className="">
			<div
				className={`group border-card-input-border ${
					disabled ? "" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-2 ${disabled ? "bg-card-input-disabled" : ""}`}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="flex items-center">
					<div
						className={`flex-1 py-2 ${
							error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
						}`}
					>
						{output ? (
							<div className={`text-xl py-0 bg-transparent`}>{output}</div>
						) : (
							<BigNumberInput
								className={`w-full px-0 py-0 text-xl bg-transparent`}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value}
								onChange={onChange}
								autoFocus={autoFocus}
								disabled={disabled}
							/>
						)}
					</div>

					<div className="mr-2">
						<TokenLogo currency={symbol} size={6} />
					</div>

					<div className="text-card-input-label text-left">{symbol}</div>
				</div>

				{limitLabel || max || min || reset ? (
					<div className="flex flex-row gap-2 py-1">
						{limitLabel != undefined && <div className="text-text-secondary">{limitLabel}</div>}
						{limitLabel != undefined && (
							<div className="text-text-primary truncate">{formatUnits(limit, Number(limitDigit))}</div>
						)}
						{!disabled && max != undefined && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus"
								onClick={() => {
									if (max !== undefined) {
										onChange(max.toString());
										onMax();
									}
								}}
							>
								Max
							</div>
						)}
						{!disabled && min != undefined && (
							<div
								className="text-card-input-min cursor-pointer hover:text-card-input-focus"
								onClick={() => {
									if (min !== undefined) {
										onChange(min.toString());
										onMin();
									}
								}}
							>
								Min
							</div>
						)}
						{!disabled && reset != undefined && reset != BigInt(value) && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus"
								onClick={() => {
									if (reset !== undefined) {
										onChange(reset.toString());
										onReset();
									}
								}}
							>
								Reset
							</div>
						)}
					</div>
				) : null}
			</div>

			<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
		</div>
	);
}
