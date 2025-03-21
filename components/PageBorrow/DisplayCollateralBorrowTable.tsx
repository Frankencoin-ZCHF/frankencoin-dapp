import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { zeroAddress } from "viem";
import Link from "next/link";
import AppLink from "@components/AppLink";

const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	symbol: string;
	symbolTiny?: string;
	name: string;
	address: string;
	className?: string;
	bold?: boolean;
}

export default function DisplayCollateralBorrowTable({ bold = true, symbol, symbolTiny = "", name, address, className }: Props) {
	const url = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<Link href={url} onClick={openExplorer}>
			<div className={`md:-ml-12 flex items-center ${className}`}>
				<div className="mr-4">
					<TokenLogo currency={symbol} />
				</div>

				<div className="flex flex-col">
					<span className={`text-left`}>
						<AppLink label={symbol} href={url} external={true} className="text-left" />
						<span className="text-xs font-normal">{` ${symbolTiny}`}</span>
					</span>
					<span className="text-text-subheader text-left max-lg:w-[4rem] lg:w-[7rem] max-sm:w-[9rem] text-sm truncate">
						{name}
					</span>
				</div>
			</div>
		</Link>
	);
}
