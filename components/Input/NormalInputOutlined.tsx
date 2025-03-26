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
		<div className={`w-full overflow-hidden p-2 rounded-xl border-2 border-transparent relative flex flex-col before:absolute before:inset-0 before:rounded-xl before:border before:pointer-events-none before:transition-colors before:duration-200 ${
			isFocused ? "before:border-2 before:border-input-borderFocus" : "before:border-input-border hover:before:border-input-borderHover"
		}`}>
			<div className="w-full flex-nowrap p-1.5 justify-start items-center gap-1.5 flex overflow-hidden">
				{showTokenLogo && <TokenLogo currency="deuro" size={6} />}
				<div className="min-w-0 flex-1 overflow-hidden">
					<BigNumberInput
						className={`p-0 w-full text-input-primary placeholder:text-input-placeholder text-2xl font-medium leading-tight ${
							isError ? "!text-text-warning" : ""
						}`}
						placeholder="0"
						value={value}
						onChange={onChange}
						decimals={decimals}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
					/>
				</div>
				{unit && <div className="ml-3 text-lg font-medium leading-snug whitespace-nowrap flex-shrink-0">
					{unit}
				</div>}
			</div>
			{adornamentRow}
		</div>
	);
}