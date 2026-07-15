import { useRef } from "react";
import { BigNumberInput } from "./BigNumberInput";

export type NormalInputAction = {
	label: string;
	onClick: () => void;
};

interface Props {
	label?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	warning?: string;

	symbol: string;
	digit?: bigint | number;
	output?: string; // overwrite with string output
	note?: string;
	actions?: NormalInputAction[]; // clickable fill-in helpers like "Max", analogous to TokenInput's buttons

	autoFocus?: boolean;
	disabled?: boolean;
}

export default function NormalInput({
	label = "Send",
	placeholder = "Input Amount",
	value = "",
	onChange,
	error,
	warning,
	symbol,
	digit = 18,
	output,
	note,
	actions,
	autoFocus = false,
	disabled = false,
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
					disabled ? "bg-card-input-disabled" : "hover:border-card-input-hover"
				} focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1`}
				onClick={handleClick}
			>
				{label && <div className="flex text-card-input-label my-1">{label}</div>}

				<div className="flex items-center gap-1">
					<div
						className={`flex-1 py-2 ${
							error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
						}`}
					>
						{output ? (
							<div className={`text-3xl py-0 bg-transparent`}>{output}</div>
						) : (
							<BigNumberInput
								inputRefChild={inputRef}
								className={`w-full px-0 py-0 text-3xl text-right ${disabled ? "bg-card-input-disabled" : ""}`}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value || ""}
								onChange={onChange}
								autoFocus={autoFocus}
								disabled={disabled}
							/>
						)}
					</div>

					<div className="text-card-input-label text-left">{symbol}</div>
				</div>

				{!disabled && actions && actions.length > 0 && (
					<div className="flex flex-row justify-end gap-3 py-1">
						{actions.map((action) => (
							<div
								key={action.label}
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={(e) => {
									e.stopPropagation();
									action.onClick();
								}}
							>
								{action.label}
							</div>
						))}
					</div>
				)}
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
