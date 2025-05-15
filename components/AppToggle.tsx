import { useState } from "react";

interface Props {
	label: string;
	enabled?: boolean;
	onChange?: (enabled: boolean) => void;
}

export default function AppToggle({ label, enabled = false, onChange = () => {} }: Props) {
	return (
		<div className="flex gap-4 items-center">
			<button
				onClick={() => onChange(!enabled)}
				role="switch"
				aria-checked={enabled}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
					enabled ? "bg-blue-600" : "bg-gray-300"
				}`}
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
