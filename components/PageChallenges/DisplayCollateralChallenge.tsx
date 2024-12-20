import { formatCurrency } from "@utils";
import dynamic from "next/dynamic";
import { useContractUrl } from "../../hooks/useContractUrl";
import { zeroAddress } from "viem";
import Link from "next/link";
import { ChallengesQueryItem, PositionQuery } from "@deuro/api";
const TokenLogo = dynamic(() => import("../TokenLogo"), { ssr: false });

interface Props {
	position: PositionQuery;
	challenge: ChallengesQueryItem;
	challengeSizeDEURO: number;
	challengePrice: number;
	className?: string;
}

// @dev: not used
export default function DisplayCollateralChallenge({
	position,
	challenge,
	challengeSizeDEURO,
	challengePrice,
	className,
}: Props) {
	const url = useContractUrl(position.collateral || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const challengeRemainingSize: number =
		(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString())) / 10 ** position.collateralDecimals;
	const challengeRemainingPriceDEURO: number = challengePrice / 10 ** (36 - position.collateralDecimals);
	const challengeAuctionPriceColor: string = challengeRemainingPriceDEURO <= challengeSizeDEURO ? "text-green-300" : "text-red-300";

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
					{formatCurrency(challengeRemainingPriceDEURO, 2, 2) || "0.00"} {position.deuroSymbol}
				</span>
			</div>
		</div>
	);
}
