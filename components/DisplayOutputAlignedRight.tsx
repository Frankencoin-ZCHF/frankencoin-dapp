import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	className?: string;
	output?: string;
	amount?: bigint | number;
	unit?: string;
	digits?: number | bigint;
	bold?: boolean;
	big?: boolean;
}

export default function DisplayOutputAlignedRight({ className, output, amount, unit, digits = 18, bold = false, big = false }: Props) {
	return (
		<div className={className || "pt-2"}>
			<div className="flex items-center text-right gap-2">
				{output != undefined ? (
					<div className={`flex-1 text-text-primary ${bold && "font-bold"} ${big ? "text-xl" : "text-lg"}`}>{output}</div>
				) : (
					<div className={`flex-1 text-text-primary ${bold && "font-bold"} ${big ? "text-xl" : "text-lg"}`}>
						{amount ? formatCurrency(typeof amount === "number" ? amount : formatUnits(amount, Number(digits))) : "0.00"}
					</div>
				)}
				<div className="text-card-input-label">
					{unit != undefined ? (
						<>
							<span>{` ${unit}`}</span>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}
