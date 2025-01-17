import TokenLogo from "@components/TokenLogo";
import { BigNumberInput } from "./BigNumberInput";
import { useState } from "react";

interface NormalInputOutlinedProps {
	value: string;
	onChange: (value: string) => void;
	decimals: number;
}

export function NormalInputOutlined({ value, onChange, decimals }: NormalInputOutlinedProps) {
	return (
		<div className="self-stretch p-2 rounded-xl border border-input-border flex-row justify-between items-start gap-2 flex">
			<div className="self-stretch p-1.5 justify-start items-center gap-1.5 inline-flex overflow-hidden">
				<TokenLogo currency="deuro" size={6} />
				<BigNumberInput
					className="p-0 grow text-input-primary placeholder:text-input-placeholder text-2xl font-medium leading-tight"
					placeholder="0"
					value={value}
					onChange={onChange}
					decimals={decimals}
				/>
			</div>
		</div>
	);
}