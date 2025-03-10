import TokenLogo from "@components/TokenLogo";
import { BigNumberInput } from "./BigNumberInput";
import { useState } from "react";
interface NormalInputOutlinedProps {
	value: string;
	onChange: (value: string) => void;
	decimals: number;
	showTokenLogo?: boolean;
	adornamentRow?: React.ReactNode;
	unit?: string;
	isError?: boolean;
}

export function NormalInputOutlined({ value, onChange, decimals, showTokenLogo = true, adornamentRow, unit, isError }: NormalInputOutlinedProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className={`self-stretch p-2 rounded-xl border-2 border-transparent relative flex flex-col flex before:absolute before:inset-0 before:rounded-xl before:border before:pointer-events-none ${
			isFocused ? "before:border-2 before:border-input-borderFocus" : "before:border-input-border"
		}`}>
			<div className="w-full max-w-full self-stretch p-1.5 justify-start items-center gap-1.5 inline-flex overflow-hidden">
				{showTokenLogo && <TokenLogo currency="deuro" size={6} />}
				<BigNumberInput
					className={`p-0 grow text-input-primary placeholder:text-input-placeholder text-2xl font-medium leading-tight ${
						isError ? "!text-text-warning" : ""
					}`}
					placeholder="0"
					value={value}
					onChange={onChange}
					decimals={decimals}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
				/>
				{unit && <div className="ml-3 text-lg font-medium leading-snug">
					{unit}
				</div>}
			</div>
			{adornamentRow}
		</div>
	);
}