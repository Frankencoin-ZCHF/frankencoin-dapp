interface Props {
	label: string;
	enabled?: boolean;
	disabled?: boolean;
	onChange?: (enabled: boolean) => void;
}

export default function AppToggle({ label, enabled = false, disabled, onChange = () => {} }: Props) {
	return (
		<div className="flex gap-4 items-center">
			<button
				onClick={() => !disabled && onChange(!enabled)}
				role="switch"
				aria-checked={enabled}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
					disabled ? "bg-card-input-disabled cursor-not-allowed" : "hover:border-card-input-hover cursor-pointer"
				} ${!disabled && enabled ? "bg-card-input-min" : "bg-card-input-border"}`}
			>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
						enabled ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</button>

			<span>{label}</span>
		</div>
	);
}
