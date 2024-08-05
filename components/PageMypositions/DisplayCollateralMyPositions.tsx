import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { Address, formatUnits, zeroAddress } from "viem";
import Link from "next/link";
import { PositionQuery } from "@frankencoin/api";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	position: PositionQuery;
	collateralPrice: number;
	zchfPrice: number;
	className?: string;
}

export default function DisplayCollateralMyPositions({ position, collateralPrice, zchfPrice, className }: Props) {
	const url = useContractUrl(position.position || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const collateralSize: number = parseInt(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals - 2)) / 100;
	const collateralValue: number = (collateralSize * collateralPrice) / zchfPrice;

	return (
		<div className={`-ml-12 flex items-center ${className}`}>
			<Link href={url} onClick={openExplorer}>
				<div className="mr-4">
					<TokenLogo currency={position.collateralSymbol} />
				</div>
			</Link>

			<div className="flex flex-col">
				<span className={`font-bold`}>{formatCurrency(collateralSize, 2, 2) + " " + position.collateralSymbol}</span>
				<span className="text-sm text-slate-500">{formatCurrency(collateralValue, 2, 2)} ZCHF</span>
			</div>
		</div>
	);
}
