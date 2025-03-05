import { formatUnits } from "viem";

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

	autofocus?: boolean;
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
	autofocus = false,
	disabled = false,
}: Props) {
	const isNumber = (value: string): boolean => {
		return !isNaN(Number(value)) && value.trim() !== "";
	};
	value = isNumber(value) ? formatUnits(BigInt(value), Number(digit)).toString() : value;
	return (
		<div className="">
			<div
				className={`group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 ${disabled ? "bg-card-input-disabled" : ""}`}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<div className="flex items-center">
					<div
						className={`flex-1 my-2 text-lg bg-transparent ${
							error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
						}`}
					>
						{output ? (
							<div className={``}>{output}</div>
						) : (
							<input
								className={`w-full`}
								placeholder={placeholder}
								value={value}
								onChange={(e) => onChange?.(e.target.value)}
								disabled={disabled}
								autoFocus={autofocus}
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
