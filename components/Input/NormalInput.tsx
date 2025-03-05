import { formatUnits } from "viem";
import { BigNumberInput } from "./BigNumberInput";

interface Props {
	label?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;

	symbol: string;
	digit?: bigint | number;
	output?: string; // overwrite with string output
	note?: string;

	autoFocus?: boolean;
	disabled?: boolean;
}

export default function NormalInput({
	label = "Send",
	placeholder = "Input Amount",
	value = "",
	onChange,
	error,
	symbol,
	digit = 18,
	output,
	note,
	autoFocus = false,
	disabled = false,
}: Props) {
	return (
		<div className="">
			<div
				className={`group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 ${disabled ? "bg-card-input-disabled" : ""}`}
			>
				<div className="flex text-card-input-label py-1">{label}</div>

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

					<div className="w-16 text-card-input-label text-center">{symbol}</div>
				</div>
			</div>

			<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
		</div>
	);
}
