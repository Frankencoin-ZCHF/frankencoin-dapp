import { useState } from "react";

interface TextInputOutlinedProps {
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export const TextInputOutlined = ({ className, placeholder, value, onChange }: TextInputOutlinedProps) => {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div
			className={`p-2 px-3 sm:p-3 rounded-lg border-1 border-transparent relative flex-col justify-center items-start gap-2 flex before:absolute before:inset-0 before:rounded-xl before:border before:pointer-events-none before:transition-colors before:duration-200 ${
				isFocused ? "before:border-2 before:border-input-borderFocus" : "before:border-input-border hover:before:border-input-borderHover"
			} ${className}`}
		>
			<input
				className="p-0 m-0 self-stretch grow text-input-primary placeholder:text-text-icon text-base sm:text-lg font-medium leading-tight"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			/>
		</div>
	);
};
