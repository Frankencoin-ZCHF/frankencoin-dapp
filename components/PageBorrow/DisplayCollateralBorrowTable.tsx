import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { zeroAddress } from "viem";
import Link from "next/link";
import { formatCurrency } from "@utils";

const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	symbol: string;
	symbolTiny?: string;
	name: string;
	address: string;
	className?: string;
	balance?: number;
	price: number;
	hideMyWallet?: boolean;
}

export default function DisplayCollateralBorrowTable({
	symbol,
	symbolTiny = "",
	name,
	address,
	className,
	balance,
	price,
	hideMyWallet,
}: Props) {
	const url = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className={`md:-ml-12 flex items-center ${className}`}>
			<div className="mr-4">
				<TokenLogo currency={symbol} />
			</div>

			<div className="flex flex-col">
				<span className="text-left font-bold max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] text-sm md:text-nowrap max-md:truncate">
					<span className="text-lg">{`${name}`}</span>
					<span className="text-xs font-normal">{` ${symbolTiny}`}</span>
				</span>
				{!hideMyWallet && (
					<span className="text-text-subheader text-left max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] text-nowrap">
						{formatCurrency(balance ?? 0, 2, 2)} {symbol} • {formatCurrency((balance ?? 0) * price)} ZCHF
					</span>
				)}
			</div>
		</div>
	);
}
