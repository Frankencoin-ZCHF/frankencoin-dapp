import { formatBigInt, formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { Address, formatUnits, zeroAddress } from "viem";
import Link from "next/link";
import { ChallengesQueryItem, PositionQuery } from "@deuro/api";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	position: PositionQuery;
	challenge: ChallengesQueryItem;
	collateralPrice: number;
	zchfPrice: number;
	challengeSize?: number;
	challengeSizeZchf: number;
	challengePrice: number;
	className?: string;
}

// @dev: not used
export default function DisplayCollateralChallenge({
	position,
	challenge,
	collateralPrice,
	zchfPrice,
	challengeSize,
	challengeSizeZchf,
	challengePrice,
	className,
}: Props) {
	const url = useContractUrl(position.collateral || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const collateralSize: number = parseInt(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals - 2)) / 100;
	const collateralValue: number = (collateralSize * collateralPrice) / zchfPrice;

	const challengeRemainingSize: number =
		(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString())) / 10 ** position.collateralDecimals;
	const challengeRemainingPriceZchf: number = challengePrice / 10 ** (36 - position.collateralDecimals);
	const challengeRemainingPriceUsd: number = challengeRemainingPriceZchf * zchfPrice;
	const challengeAuctionPriceColor: string = challengeRemainingPriceZchf <= challengeSizeZchf ? "text-green-300" : "text-red-300";

	return (
		<div className={`flex items-center ${className}`}>
			<Link href={url} onClick={openExplorer}>
				<div className="-ml-12 mr-4">
					<TokenLogo currency={position.collateralSymbol} />
				</div>
			</Link>

			<div className="flex flex-col text-text-primary">
				<span className={`font-bold`}>
					{challengeRemainingSize > 0 ? formatCurrency(challengeRemainingSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</span>
				<span className={`text-sm ${challengeAuctionPriceColor}`}>
					{formatCurrency(challengeRemainingPriceZchf, 2, 2) || "0.00"} {position.deuroSymbol}
				</span>
			</div>
		</div>
	);
}
