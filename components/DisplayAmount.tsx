import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../hooks/useContractUrl";
import { formatUnits, zeroAddress } from "viem";
const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
	amount?: bigint | number;
	subAmount?: number;
	subCurrency?: string;
	subColor?: string;
	bold?: boolean;
	big?: boolean;
	noRounding?: boolean;
	digits?: number | bigint;
	currency?: string;
	hideLogo?: boolean;
	className?: string;
	address?: string;
	usdPrice?: number;
	logoSize?: number;
}

export default function DisplayAmount({
	amount,
	subAmount,
	subCurrency,
	subColor,
	bold = false,
	big,
	digits = 18,
	currency,
	hideLogo,
	className,
	address,
	usdPrice,
	logoSize = 8,
}: Props) {
	const url = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className={`flex items-center ${className}`}>
			{!hideLogo && currency && (
				<div className="mr-3">
					<TokenLogo currency={currency} size={logoSize} />
				</div>
			)}
			<div>
				<div>
					<span className={`${bold && "font-bold"} ${big ? "text-3xl" : "text-base leading-5"}`}>
						{amount ? formatCurrency(typeof amount === "number" ? amount : formatUnits(amount, Number(digits))) : "0.00"}
					</span>
					<span className={`${bold && "font-bold"} ${big ? "text-3xl" : "text-base leading-5"}`}>
						{currency == "%" ? "" : " "}
						{address ? (
							<a href={url} target="_blank" rel="noreferrer" onClick={openExplorer}>
								{currency}
							</a>
						) : (
							currency
						)}
					</span>
				</div>
				{subAmount == undefined && usdPrice && usdPrice > 0 && (
					<div>
						<span className="text-sm text-slate-500">
							{amount
								? formatCurrency(
										formatUnits(
											typeof amount === "number" ? BigInt(amount) : amount * BigInt(usdPrice * 1e18),
											Number(digits) + 18
										)
								  )
								: "0.00"}{" "}
							USD
						</span>
					</div>
				)}
				{subAmount == undefined && subCurrency && (
					<div>
						<span className="text-sm text-slate-500">{subCurrency}</span>
					</div>
				)}
				{subAmount && subCurrency && (
					<div>
						<span className={`text-sm ${subColor}`}>{formatCurrency(subAmount, 2, 2) + " " + subCurrency}</span>
					</div>
				)}
			</div>
		</div>
	);
}
