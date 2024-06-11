import { formatBigInt } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../hooks/useContractUrl";
import { zeroAddress } from "viem";
const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
	amount: bigint;
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
	bold = false,
	big,
	noRounding,
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
				{usdPrice && usdPrice > 0 && (
					<div>
						<span className="text-sm text-slate-500">
							{formatBigInt(amount * BigInt(usdPrice * 1e18), Number(digits) + 18)} USD
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
