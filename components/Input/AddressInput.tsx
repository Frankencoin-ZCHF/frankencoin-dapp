import { useRef } from "react";

interface Props {
	label?: string;
	className?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	note?: string;
}

export default function AddressInput({ label, className, placeholder, value, error, onChange, autoFocus, disabled, note }: Props) {
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
			</div>

			{error ? <div className="flex my-2 px-3.5 text-text-warning">{error}</div> : <div className="flex my-2 px-3.5">{note}</div>}
		</div>
	);
}
