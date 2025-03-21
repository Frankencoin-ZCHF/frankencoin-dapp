import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
import { formatUnits } from "viem";
import Select from "react-select";
import { components } from "react-select";

const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	label?: string;
	symbol: string;
	symbolOptions: string[];
	symbolOnChange: (o: { value: string; label: string }) => void;
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
	output?: string | number;
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

export default function TokenInputSelect({
	label = "Send",
	placeholder = "Input Amount",
	symbol,
	symbolOptions,
	symbolOnChange,
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
	const options = symbolOptions.map((o) => {
		return { value: o, label: o };
	});
	const symbolIdx = symbolOptions.findIndex((o) => o === symbol);

	return (
		<div className="">
			<div
				className={`group border-card-input-border ${
					disabled ? "" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1 ${disabled ? "bg-card-input-disabled" : ""}`}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="flex items-center pb-2">
					<div
						className={`flex-1 ${
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
								value={value || ""}
								onChange={onChange}
								autoFocus={autoFocus}
								disabled={disabled}
							/>
						)}
					</div>

					<div className="px-3 items-center">
						<Select
							className="-mr-3"
							options={options}
							defaultValue={options[symbolIdx]}
							value={options[symbolIdx]}
							onChange={(o) => o && symbolOnChange(o)}
							isSearchable={false}
							components={{
								SingleValue: ({ children, ...props }: any) => {
									return (
										<components.SingleValue {...props}>
											<div className="flex items-center gap-2 py-2">
												<TokenLogo currency={props.data.value} size={6} />
												{children}
											</div>
										</components.SingleValue>
									);
								},
								Option: ({ children, ...props }: any) => {
									return (
										<components.Option {...props}>
											<div className="flex items-center gap-2 min-w-20">
												<TokenLogo currency={props.data.value} size={6} />
												{children}
											</div>
										</components.Option>
									);
								},
							}}
							styles={{
								indicatorSeparator: () => ({
									display: "none",
								}),
								dropdownIndicator: (baseStyles) => ({
									...baseStyles,
									color: "#272B38",
								}),
								control: (baseStyles, state) => ({
									...baseStyles,
									backgroundColor: state.isFocused ? "#EAEBF0" : "#FFFFFF", // background of container
									borderRadius: "0.5rem", // This makes the main control round
									borderColor: state.isFocused ? "#DFE0E6" : "#F0F1F5",
									borderWidth: "0.1rem",
									boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
								}),
								option: (baseStyles, state) => ({
									...baseStyles,
									backgroundColor: state.isFocused ? "#F5F6F9" : "transparent", // single option in option menu
									color: state.isFocused ? "#092f62" : "#092f62", // text color from option menu
								}),
								singleValue: (baseStyles) => ({
									...baseStyles,
									color: "#272B38", // text color of selected value in control container
									borderRadius: "0.5rem", // This makes the main control rounder
									boxShadow: "2", // Remove the focus shadow
								}),
								menu: (baseStyles) => ({
									...baseStyles,
									backgroundColor: "#FFFFFF",
									borderRadius: "0.5rem", // This rounds the dropdown menu
									overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
								}),
							}}
						/>
					</div>
				</div>

				{limitLabel != undefined || max != undefined || min != undefined || reset != undefined ? (
					<div className="flex flex-row gap-2 py-1">
						<div className="flex-1 min-w-0">
							{limitLabel != undefined && (
								<div className="flex flex-row gap-2 w-full">
									<div className="text-text-secondary flex-shrink-0">{limitLabel}</div>
									<div className="text-text-primary truncate min-w-0 overflow-hidden">
										{formatUnits(limit, Number(limitDigit))}
									</div>
								</div>
							)}
						</div>

						{!disabled && max != undefined && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
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
								className="text-card-input-min cursor-pointer hover:text-card-input-focus font-extrabold"
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
								className="text-card-input-reset cursor-pointer hover:text-card-input-focus font-extrabold"
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
