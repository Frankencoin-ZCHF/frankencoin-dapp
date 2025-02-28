import TokenLogo from "@components/TokenLogo";
import { BigNumberInput } from "./BigNumberInput";
import { useState } from "react";
interface NormalInputOutlinedProps {
	value: string;
	onChange: (value: string) => void;
	decimals: number;
}

export function NormalInputOutlined({ value, onChange, decimals }: NormalInputOutlinedProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className={`self-stretch p-2 rounded-xl border-2 border-transparent relative flex-row justify-between items-start gap-2 flex before:absolute before:inset-0 before:rounded-xl before:border before:pointer-events-none ${
			isFocused ? "before:border-2 before:border-input-borderFocus" : "before:border-input-border"
		}`}>
			<div className="self-stretch p-1.5 justify-start items-center gap-1.5 inline-flex overflow-hidden">
				<TokenLogo currency="deuro" size={6} />
				<BigNumberInput
					className="p-0 grow text-input-primary placeholder:text-input-placeholder text-2xl font-medium leading-tight"
					placeholder="0"
					value={value}
					onChange={onChange}
					decimals={decimals}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
				/>
			</div>
		</div>
	);
}