import { formatUnits } from "viem";
import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { WAGMI_CHAIN, WAGMI_CHAINS } from "../../app.config";
import ChainBySelect from "./ChainBySelect";
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
	chain?: string;
	onChangeChain?: (value: string) => void;
	onChange?: (value: string) => void;
	onMin?: () => void;
	onMax?: () => void;
	onReset?: () => void;
	autoFocus?: boolean;
	disabled?: boolean;
	error?: string;
	prefixLabel?: string;
}

export default function TokenInputChain({
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
	value = "",
	chain = WAGMI_CHAIN.name,
	autoFocus,
	disabled,
	onChange = () => {},
	onMin = () => {},
	onMax = () => {},
	onReset = () => {},
	onChangeChain = () => {},
	error,
	prefixLabel,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		if (inputRef.current && !disabled) {
			inputRef.current.focus();
		}
	};

	return (
		<div className="">
			<div
				className={`group border-card-input-border ${
					disabled ? "" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1 ${disabled ? "bg-card-input-disabled" : ""}`}
				onClick={handleClick}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="flex items-center" onClick={(e) => e.stopPropagation()}>
					<div
						className={`flex-1 py-2 ${
							error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
						}`}
					>
						{output ? (
							<div className={`text-xl py-0 bg-transparent`}>{output}</div>
						) : (
							<BigNumberInput
								inputRefChild={inputRef}
								className={`w-full px-0 py-0 text-xl ${disabled ? "bg-card-input-disabled" : ""}`}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value || ""}
								onChange={onChange}
								autoFocus={autoFocus}
								disabled={disabled}
							/>
						)}
					</div>

					<div className="md:col-span-2">
						<ChainBySelect
							chains={WAGMI_CHAINS.map((c) => c.name)}
							chain={chain}
							chainOnChange={onChangeChain}
							invertColors={disabled}
							prefixLabel={prefixLabel}
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

						{!disabled && max != undefined && max != BigInt(value) && (
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
						{!disabled && min != undefined && min != BigInt(value) && min != max && (
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
						{!disabled && reset != undefined && reset != BigInt(value) && reset != min && reset != max && (
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

			{error ? <div className="flex my-2 px-3.5 text-text-warning">{error}</div> : <div className="flex my-2 px-3.5">{note}</div>}
		</div>
	);
}
