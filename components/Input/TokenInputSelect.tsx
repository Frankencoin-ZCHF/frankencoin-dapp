import DisplayAmount from "../DisplayAmount";
import { formatCurrency } from "@utils";
import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
import { formatUnits } from "viem";
import Select, { components } from "react-select";
import { MaxButton } from "./MaxButton";
import { useTranslation } from "next-i18next";
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
	limitDigits?: bigint | number;
	hideLimitIcon?: boolean;
	output?: string | number;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	error?: string;
	showMaxButton?: boolean;
}

export default function TokenInputSelect({
	label,
	placeholder,
	symbol,
	symbolOptions,
	symbolOnChange,
	max = 0n,
	digit = 18n,
	balanceLabel,
	hideMaxLabel,
	limit = 0n,
	limitLabel,
	limitDigits = 18n,
	hideLimitIcon = false,
	output,
	note,
	value,
	disabled,
	onChange,
	error,
	showMaxButton = true,
}: Props) {
	const { t } = useTranslation();

	const options = symbolOptions.map((o) => {
		return { value: o, label: o };
	});
	const symbolIdx = symbolOptions.findIndex((o) => o === symbol);
	const showFootnote = limit >= 0n && limitLabel || note;

	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">
				<div className="flex-1 text-text-muted text-base font-medium leading-tight">{label || t('common.send')}</div>
				{symbol && (
					<div
						className={`flex gap-2 items-center text-text-muted text-base font-medium leading-tight cursor-pointer ${hideMaxLabel && "hidden"}`}
					>
						{balanceLabel || t('common.balance_label')}
						<span>
							{formatCurrency(formatUnits(max, Number(digit)))} {symbol}
						</span>
						{showMaxButton && <MaxButton onClick={() => onChange?.(max.toString())} className="text-xs !py-0 font-extrabold" />}
					</div>
				)}
			</div>

			<div className="flex items-center rounded-xl bg-input-bg py-2 pl-4 pr-2 gap-3">
				<div className="flex items-center justify-center">
					<TokenLogo currency={symbol} size={8} />
				</div>
				<div className="flex-1">
					{output != undefined ? (
						<div className="px-3 py-2 text-text-disabled font-bold transition-opacity">{output}</div>
					) : (
						<div
							className={`flex h-11 rounded-lg bg-white border ${
								error ? "border-text-warning" : "border-input-border"
							}`}
						>
							<BigNumberInput
								autofocus={true}
								decimals={Number(digit)}
								placeholder={placeholder || t('common.input_placeholder')}
								value={value || ""}
								onChange={(e) => onChange?.(e)}
								className={`w-full flex-1 p-3 bg-transparent text-lg placeholder:text-left text-right leading-tight font-medium text-input-primary`}
								disabled={disabled}
							/>
						</div>
					)}
				</div>
				<div className="flex items-center h-full">
					<Select
						className="flex-1  text-base font-medium leading-tight"
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
								"&:hover": {
									color: "#e2e8f0",
									cursor: "pointer",
								},
							}),
							control: (baseStyles, state) => ({
								...baseStyles,
								backgroundColor: state.isFocused ? "#136fd2" : "#092f62",
								color: "#e2e8f0",
								borderRadius: "0.5rem", // This makes the main control rounder
								borderWidth: "0",
								boxShadow: "none", // Remove the focus shadow
								minWidth: "7.5rem",
								height: "2.75rem",
								"&:hover": {
									backgroundColor: "#0F80F0",
									cursor: "pointer",
								},
							}),
							option: (baseStyles, state) => ({
								...baseStyles,
								backgroundColor: state.isFocused || state.isSelected ? "#e9ebf0" : "transparent",
								color: "#272b37", // text color from option menu
								borderRadius: "0.5rem",
								fontWeight: "400",
								fontSize: "16px",
								marginTop: "2px",
								padding: "0.5625rem 0.5rem",
								"&:active": {
									backgroundColor: "#e9ebf0",
								},
							}),
							singleValue: (baseStyles) => ({
								...baseStyles,
								color: "#e2e8f0", // text color of selected value
							}),
							menu: (baseStyles) => ({
								...baseStyles,
								backgroundColor: "#ffffff",
								borderRadius: "0.5rem", // This rounds the dropdown menu
								overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
								boxShadow: "0px 10px 22px 0px rgba(45,77,108,0.15)",
								marginTop: "0",
							}),
							input: (baseStyles) => ({
								...baseStyles,
								color: "#ffffff",
								fontSize: "0",
							}),
							menuList: (base, props) => ({
								...base,
								padding: "0",
							}),
						}}
						components={{
							Menu: ({ children, ...props }) => (
								<components.Menu {...props}>
									<div className="p-1">
										<div className="py-2 text-text-muted pointer-events-none text-slate-400 text-center text-base font-normal leading-tight">
											{t('common.choose_value')}
										</div>
										{children}
									</div>
								</components.Menu>
							),
						}}
					/>
				</div>
			</div>
			{error && <div className="mt-2 px-1 text-text-warning">{error}</div>}
			{showFootnote && (
				<div className="mt-2 px-1 flex items-center">
					{limit >= 0n && limitLabel && (
						<>
							<span>{limitLabel} :&nbsp;</span>
						<DisplayAmount amount={limit} currency={symbol} digits={limitDigits} logoSize={6} hideLogo={hideLimitIcon} />
					</>
				)}
					{note && <span>{note}</span>}
				</div>
			)}
		</div>
	);
}

