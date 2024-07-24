import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { zeroAddress } from "viem";
import Link from "next/link";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	symbol: string;
	name: string;
	address: string;
	className?: string;
	bold?: boolean;
}

export default function DisplayCollateralBorrowTable({ bold = true, symbol, name, address, className }: Props) {
	const url = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className={`flex items-center ${className}`}>
			<Link href={url} onClick={openExplorer}>
				<div className="mr-4">
					<TokenLogo currency={symbol} />
				</div>
			</Link>

			<div className="flex flex-col">
				<span className={`${bold && "font-bold"}`}>{symbol}</span>
				<span className="font-normal">{name}</span>
			</div>
		</div>
	);
}
