import { BigNumberInput } from "./BigNumberInput";

interface Props {
	label?: string;
	symbol: string;
	placeholder?: string;
	balanceLabel?: string;
	max?: bigint;
	digit?: bigint | number;
	hideMaxLabel?: boolean;
	limit?: bigint;
	limitLabel?: string;
	output?: string;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	autofocus?: boolean;
	disabled?: boolean;
}

export default function NormalInput({
	label = "Send",
	placeholder = "Input Amount",
	symbol,
	max = 0n,
	digit = 18n,
	output,
	note,
	value,
	onChange,
	error,
	autofocus = false,
	disabled = false,
}: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">
				<div className="flex-1">{label}</div>
			</div>

			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<div className="flex-1">
					{output ? (
						<div className="px-3 py-2 font-bold transition-opacity">{output}</div>
					) : (
						<div
							className={`flex gap-1 rounded-lg text-text-primary p-1 bg-white border-2 ${
								error ? "border-text-warning" : "border-card-content-secondary"
							}`}
						>
							<BigNumberInput
								autofocus={autofocus}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value || ""}
								onChange={(e) => onChange?.(e)}
								className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg font-bold text-input-primary`}
								disabled={disabled}
							/>
						</div>
					)}
				</div>

				<div className="hidden w-16 text-center font-bold sm:block">{symbol}</div>
			</div>
			{error && <div className="mt-2 px-1 text-red-500">{error}</div>}
		</div>
	);
}
