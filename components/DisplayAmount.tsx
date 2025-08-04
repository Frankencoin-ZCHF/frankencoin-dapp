import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../hooks/useContractUrl";
import { formatUnits, zeroAddress } from "viem";
import Link from "next/link";
const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
	className?: string;
	output?: string;
	amount?: bigint | number;
	unit?: string;
	digits?: number | bigint;
	currency?: string;
	chain?: string;
	address?: string;
	hideLogo?: boolean;
	bold?: boolean;
	big?: boolean;
}

export default function DisplayAmount({
	className,
	output,
	amount,
	digits = 18,
	currency,
	chain,
	address,
	unit,
	hideLogo,
	bold = false,
	big = false,
}: Props) {
	const url = useContractUrl(address || zeroAddress);
	return (
		<div className={className || "pt-2"}>
			<div className="flex items-center gap-2">
				{output != undefined ? (
					<div className={`flex-1 text-text-primary ${bold && "font-medium"} ${big ? "text-lg" : ""}`}>{output}</div>
				) : (
					<div className={`flex-1 text-text-primary ${bold && "font-medium"} ${big ? "text-lg" : ""}`}>
						{amount ? formatCurrency(typeof amount === "number" ? amount : formatUnits(amount, Number(digits))) : "0.00"}
					</div>
				)}

				<div className="text-card-input-label">
					{address ? (
						<Link href={url} target="_blank" rel="noreferrer">
							<div className="flex flex-row">
								{!hideLogo && currency && (
									<div className="mr-2">
										<TokenLogo currency={currency} size={6} chain={chain} />
									</div>
								)}

								<div className="">{unit || currency}</div>
							</div>
						</Link>
					) : unit != undefined ? (
						<>
							{" "}
							<span>{unit}</span>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}
