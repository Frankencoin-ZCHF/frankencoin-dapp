import DisplayAmount from "../DisplayAmount";
import { formatCurrency } from "@utils";
import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
import { formatUnits } from "viem";
import Select from "react-select";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	label?: string;
	symbol: string;
	symbolOptions: string[];
	symbolOnChange: (o: { value: string; label: string }) => void;
	placeholder?: string;
	balanceLabel?: string;
	max?: bigint;
	digit?: bigint | number;
	hideMaxLabel?: boolean;
	limit?: bigint;
	limitLabel?: string;
	output?: string | number;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	error?: string;
}

export default function TokenInputSelect({
	label = "Send",
	placeholder = "Input Amount",
	symbol,
	symbolOptions,
	symbolOnChange,
	max = 0n,
	digit = 18n,
	balanceLabel = "Balance: ",
	hideMaxLabel,
	limit = 0n,
	limitLabel,
	output,
	note,
	value,
	disabled,
	onChange,
	error,
}: Props) {
	const options = symbolOptions.map((o) => {
		return { value: o, label: o };
	});
	const symbolIdx = symbolOptions.findIndex((o) => o === symbol);

	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">
				<div className="flex-1">{label}</div>
				{symbol && (
					<div
						className={`flex gap-2 items-center cursor-pointer ${hideMaxLabel && "hidden"}`}
						onClick={() => onChange?.(max.toString())}
					>
						{balanceLabel}
						<span className="font-bold text-link">
							{formatCurrency(formatUnits(max, Number(digit)))} {symbol}
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<div className="mr-4">
					<TokenLogo currency={symbol} size={10} />
				</div>
				<div className="flex-1">
					{output != undefined ? (
						<div className="px-3 py-2 font-bold transition-opacity">{output}</div>
					) : (
						<div
							className={`flex gap-1 rounded-lg p-1 bg-card-content-secondary border-2 ${
								error ? "border-text-warning" : "border-card-content-secondary"
							}`}
						>
							<BigNumberInput
								autofocus={true}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value || ""}
								onChange={(e) => onChange?.(e)}
								className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg`}
								disabled={disabled}
							/>
						</div>
					)}
				</div>
				<div className="px-4">
					<Select
						className="-mr-3"
						options={options}
						defaultValue={options[symbolIdx]}
						value={options[symbolIdx]}
						onChange={(o) => o && symbolOnChange(o)}
						styles={{
							indicatorSeparator: () => ({
								display: "none",
							}),
							dropdownIndicator: (baseStyles) => ({
								...baseStyles,
								color: "#e2e8f0",
							}),
							control: (baseStyles, state) => ({
								...baseStyles,
								backgroundColor: "#092f62",
								color: "#e2e8f0",
								borderRadius: "0.5rem", // This makes the main control rounder
								borderWidth: "0",
								boxShadow: "none", // Remove the focus shadow
							}),
							option: (baseStyles, state) => ({
								...baseStyles,
								backgroundColor: state.isFocused ? "#092f62" : "transparent",
								color: state.isFocused ? "#e2e8f0" : "#092f62", // text color from option menu
							}),
							singleValue: (baseStyles) => ({
								...baseStyles,
								color: "#e2e8f0", // text color of selected value
							}),
							menu: (baseStyles) => ({
								...baseStyles,
								backgroundColor: "#e7e7ea",
								borderRadius: "0.5rem", // This rounds the dropdown menu
								overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
							}),
						}}
					/>
				</div>
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
