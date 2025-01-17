import DisplayAmount from "../DisplayAmount";
import { formatCurrency } from "@utils";
import { BigNumberInput } from "./BigNumberInput";
import dynamic from "next/dynamic";
import { formatUnits } from "viem";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	label?: string;
	symbol: string;
	placeholder?: string;
	balanceLabel?: string;
	max?: bigint;
	digit?: bigint | number;
	hideMaxLabel?: boolean;
	limit?: bigint;
	limitLabel?: string;
	output?: string;
	note?: string;
	value?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	error?: string;
}

export default function TokenInput({
	label = "Send",
	placeholder = "Input Amount",
	symbol,
	max = 0n,
	digit = 18n,
	balanceLabel = "Balance: ",
	hideMaxLabel,
	limit = 0n,
	limitLabel,
	output,
	note,
	value,
	disabled,
	onChange,
	error,
}: Props) {
	return (
		<div>
			<div className="mb-1 flex gap-2 px-1">
				<div className="flex-1 text-text-muted">{label}</div>
				{symbol && (
					<div
						className={`flex gap-2 items-center cursor-pointer ${hideMaxLabel && "hidden"}`}
						onClick={() => onChange?.(max.toString())}
					>
						{balanceLabel}
						<span className="font-bold text-link">
							{formatCurrency(formatUnits(max, Number(digit)))} {symbol}
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center rounded-lg bg-card-content-primary p-2">
				<div className="mr-4">
					<TokenLogo currency={symbol} size={10} />
				</div>
				<div className="flex-1">
					{output ? (
						<div className="px-3 py-2 font-bold transition-opacity">{output}</div>
					) : (
						<div
							className={`flex gap-1 rounded-lg p-1 bg-white border-2 ${
								error ? "border-text-warning" : "border-card-content-secondary"
							} ${disabled ? "bg-card-body-primary text-text-header" : ""}`}
						>
							<BigNumberInput
								autofocus={true}
								decimals={Number(digit)}
								placeholder={placeholder}
								value={value || ""}
								onChange={(e) => onChange?.(e)}
								className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg`}
								disabled={disabled}
							/>
						</div>
					)}
				</div>

				<div className="hidden w-20 px-4 text-end font-bold sm:block">{symbol}</div>
			</div>
			{error && <div className="mt-2 px-1 text-text-warning">{error}</div>}
			<div className="mt-2 px-1 flex items-center">
				{limit >= 0n && limitLabel && (
					<>
						<span>{limitLabel} :&nbsp;</span>
						<DisplayAmount amount={limit} currency={symbol} />
					</>
				)}
				{note && <span>{note}</span>}
			</div>
		</div>
	);
}
