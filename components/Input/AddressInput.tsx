interface Props {
	label?: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
}

export default function AddressInput({ label, placeholder, value, error, onChange }: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">{label}</div>
			<div className="flex gap-2 items-center rounded-lg bg-card-content-primary p-2">
				<div
					className={`flex-1 gap-1 rounded-lg text-text-primary p-1 bg-white border-2 ${
						error ? "border-text-warning" : "bg-white"
					}`}
				>
					<input
						className="w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg"
						placeholder={placeholder}
						value={value}
						onChange={(e) => onChange?.(e.target.value)}
					/>
				</div>
			</div>
			<div className="mt-2 px-1 text-text-warning">{error}</div>
		</div>
	);
}
