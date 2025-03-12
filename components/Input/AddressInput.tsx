interface Props {
	label?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	autoFocus?: boolean;
	disabled?: boolean;
}

export default function AddressInput({ label, placeholder, value, error, onChange, autoFocus, disabled }: Props) {
	return (
		<div className="">
			<div
				className={`group border-card-input-border hover:border-card-input-hover focus-within:!border-card-input-focus ${
					error ? "!border-card-input-error" : ""
				} text-text-secondary border-2 rounded-lg px-3 py-2`}
			>
				<div className="flex text-card-input-label my-1">{label}</div>

				<input
					className={`w-full py-2 text-lg bg-transparent ${
						error ? "text-card-input-error" : !!value ? "text-text-primary" : "placeholder:text-card-input-empty"
					}`}
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					disabled={disabled}
					autoFocus={autoFocus}
				/>
			</div>

			<div className="flex my-2 px-3.5 text-text-warning">{error}</div>
		</div>
	);
}
