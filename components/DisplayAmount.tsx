import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../hooks/useContractUrl";
import { zeroAddress } from "viem";
const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
	amount: bigint;
	subAmount?: number;
	subCurrency?: string;
	bold?: boolean;
	big?: boolean;
	noRounding?: boolean;
	digits?: number | bigint;
	currency?: string;
	hideLogo?: boolean;
	className?: string;
	address?: string;
	usdPrice?: number;
}

export default function DisplayAmount({
	amount,
	subAmount,
	subCurrency,
	bold = false,
	big,
	digits = 18,
	currency,
	hideLogo,
	className,
	address,
	usdPrice,
}: Props) {
	const url = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className={`flex items-center ${className}`}>
			{!hideLogo && currency && (
				<div className="mr-4">
					<TokenLogo currency={currency} />
				</div>
			)}
			<div>
				<div>
					<span className={`${bold && "font-bold"} ${big && "text-3xl"}`}>{formatBigInt(amount, Number(digits))}</span>
					<span>
						&nbsp;
						{address ? (
							<a href={url} target="_blank" rel="noreferrer" onClick={openExplorer}>
								{currency}
							</a>
						) : (
							currency
						)}
					</span>
				</div>
				{!subAmount && usdPrice && usdPrice > 0 && (
					<div>
						<span className="text-sm text-slate-500">
							{formatBigInt(amount * BigInt(usdPrice * 1e18), Number(digits) + 18)} USD
						</span>
					</div>
				)}
				{!subAmount && subCurrency && (
					<div>
						<span className="text-sm text-slate-500">{subCurrency}</span>
					</div>
				)}
				{subAmount && subCurrency && (
					<div>
						<span className="text-sm text-slate-500">{formatCurrency(subAmount, 2, 2) + " " + subCurrency}</span>
					</div>
				)}
			</div>
		</div>
	);
}
