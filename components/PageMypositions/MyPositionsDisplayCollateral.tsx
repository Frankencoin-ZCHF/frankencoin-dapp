import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { Address, formatUnits, zeroAddress } from "viem";
import Link from "next/link";
import { PositionQuery } from "@deuro/api";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	position: PositionQuery;
	collateralPrice: number;
	zchfPrice: number;
	className?: string;
}

export default function MyPositionsDisplayCollateral({ position, collateralPrice, zchfPrice, className }: Props) {
	const url = useContractUrl(position.position || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const collateralSize: number = parseFloat(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals));
	const collateralValue: number = (collateralSize * collateralPrice) / zchfPrice;

	return (
		<div className={`md:-ml-12 flex items-center ${className}`}>
			<Link href={url} onClick={openExplorer}>
				<div className="mr-4 cursor-pointer">
					<TokenLogo currency={position.collateralSymbol} />
				</div>
			</Link>

			<div className="flex flex-col">
				<span className={`text-left text-text-primary font-bold`}>
					{formatCurrency(collateralSize, 2, 2) + " " + position.collateralSymbol}
				</span>
				<span className="text-left text-text-subheader text-sm">{formatCurrency(collateralValue, 2, 2)} {TOKEN_SYMBOL}</span>
			</div>
		</div>
	);
}
