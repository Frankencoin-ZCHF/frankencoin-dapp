import { useRef } from "react";

interface Props {
	label?: string;
	className?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onOwn?: () => void;
	onReset?: () => void;
	limitLabel?: string;
	own?: string;
	reset?: string;
	error?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	note?: string;
}

export default function AddressInput({
	label,
	className,
	placeholder,
	value,
	error,
	onChange = () => {},
	onOwn = () => {},
	onReset = () => {},
	limitLabel,
	own,
	reset,
	autoFocus,
	disabled,
	note,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		if (inputRef.current && !disabled) {
			inputRef.current.focus();
		}
	};

	return (
		<div className={className}>
			<div
				className={`group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-1`}
				onClick={handleClick}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<input
					ref={inputRef}
					className={`w-full py-2 text-lg text-right bg-transparent ${error ? "text-card-input-error" : "text-text-primary"}`}
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					disabled={disabled}
					autoFocus={autoFocus}
				/>

				{limitLabel != undefined || own != undefined || reset != undefined ? (
					<div className="flex flex-row gap-2 py-1">
						<div className="flex-1 min-w-0">
							{limitLabel != undefined && (
								<div className="flex flex-row gap-2 w-full">
									<div className="text-text-secondary flex-shrink-0">Own: {limitLabel}</div>
								</div>
							)}
						</div>

						{!disabled && own != undefined && own != value && (
							<div
								className="text-card-input-max cursor-pointer hover:text-card-input-focus font-extrabold"
								onClick={() => {
									if (own !== undefined) {
										onChange(own.toString());
										onOwn();
									}
								}}
							>
								Own
							</div>
						)}
						{!disabled && reset != undefined && reset != value && reset != own && (
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
