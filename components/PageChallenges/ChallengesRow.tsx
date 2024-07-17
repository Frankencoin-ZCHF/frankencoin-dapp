import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { ChallengesId, ChallengesQueryItem, PositionQuery } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { BadgeCloneColor, BadgeOriginalColor } from "../../utils/customTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCertificate } from "@fortawesome/free-solid-svg-icons";

interface Props {
	challenge: ChallengesQueryItem;
}

export default function ChallengesRow({ challenge }: Props) {
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challengesPrices = useSelector((state: RootState) => state.challenges.challengesPrices);
	const bidsChallenges = useSelector((state: RootState) => state.bids.challenges);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const challengePrice: number = parseInt(challengesPrices.map[challenge.id as ChallengesId]);
	if (challengePrice == undefined) return null;

	// Maturity
	const start: number = parseInt(challenge.start.toString()) * 1000; // timestap
	const since: number = Math.round(((Date.now() - start) / 1000 / 60 / 60) * 10) / 10; // since timestamp to now

	const duration: number = parseInt(challenge.duration.toString()) * 1000;
	const maturity: number = Math.min(...[position.expiration * 1000, start + 2 * duration]); // timestamp
	const expiration: number = Math.round(((maturity - Date.now()) / 1000 / 60 / 60) * 10) / 10; // time to expiration

	const startStr = new Date(start).toDateString().split(" ");
	const startString: string = `${startStr[2]} ${startStr[1]} ${startStr[3]} (${since}h)`;
	const expirationStr = new Date(maturity).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]} (${expiration}h)`;
	const maturityStatusColors = expiration < 24 ? "bg-red-300" : expiration < 72 ? "bg-blue-300" : "bg-green-300";

	const bids = bidsChallenges.map[challenge.id] || [];
	const bidsAverted = bids.filter((b) => b.bidType === "Averted");
	const bidsSucceeded = bids.filter((b) => b.bidType === "Succeeded");

	// Balance
	const challengeSize: number = parseInt(challenge.size.toString()) / 10 ** position.collateralDecimals;
	const challengeSizeUsd: number = collTokenPrice;
	const challengeSizeZchf: number = collTokenPrice / zchfPrice;

	// Challenge
	const challengeRemainingSize: number =
		(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString())) / 10 ** position.collateralDecimals;
	const challengeRemainingPriceZchf: number = challengePrice / 10 ** (36 - position.collateralDecimals);
	const challengeRemainingPriceUsd: number = challengeRemainingPriceZchf * zchfPrice;
	const challengeAuctionPriceColor: string = challengeRemainingPriceZchf <= challengeSizeZchf ? "text-green-300" : "text-red-300";

	// Averted
	const avertedSize: number =
		bidsAverted.reduce<number>((acc, bid) => acc + parseInt(bid.filledSize.toString()), 0) / 10 ** position.collateralDecimals;
	const avertedAvgPriceZchf: number = parseInt(challenge.liqPrice.toString()) / 10 ** (36 - position.collateralDecimals);
	const avertedPriceColor: string = avertedAvgPriceZchf <= challengeSizeZchf ? "text-green-300" : "text-red-300";

	// reducer acc. values

	// Succeeded
	const succeededSize: number =
		bidsSucceeded.reduce<number>((acc, bid) => acc + parseInt(bid.filledSize.toString()), 0) / 10 ** position.collateralDecimals;
	const succeededAvgPriceZchf: number =
		bidsSucceeded.reduce<number>((acc, bid) => {
			const filledSize: number = parseInt(bid.filledSize.toString()) / 10 ** position.collateralDecimals;
			const bidPrice: number = parseInt(bid.price.toString()) / 10 ** (36 - position.collateralDecimals);
			return acc + bidPrice * filledSize;
		}, 0) / succeededSize;

	return (
		<TableRow link={`/challenges/${challenge.number}/bid`}>
			{/* Collateral */}
			<div className="flex flex-col gap-4">
				<div className="relative col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
					<TokenLogo currency={position.collateralSymbol.toLowerCase()} size={16} />
					<FontAwesomeIcon
						className="absolute top-12 left-12"
						color={position.isOriginal ? BadgeOriginalColor : BadgeCloneColor}
						icon={faCertificate}
					/>
				</div>
				<div>
					<div className="text-sm font-bold text-text-subheader w-16 text-center">{position.collateralSymbol}</div>
				</div>
			</div>

			{/* challenge */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{formatCurrency(challengeSize, 2, 2)} {position.collateralSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(challengeSizeZchf, 2, 2)} {position.zchfSymbol}
				</div>
				{/* <div className="col-span-2 text-md text-text-subheader">{formatCurrency(challengeSizeUsd, 2, 2)} USD</div> */}
			</div>

			{/* remaining */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{challengeRemainingSize > 0 ? formatCurrency(challengeRemainingSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`col-span-2 text-md ${challengeAuctionPriceColor}`}>
					{formatCurrency(challengeRemainingPriceZchf, 2, 2) || "0.00"} {position.zchfSymbol}
				</div>
				{/* <div className={`col-span-2 text-md ${challengeAuctionPriceColor}`}>
					{formatCurrency(challengeRemainingPriceUsd, 2, 2) || "0.00"} USD
				</div> */}
			</div>

			{/* Averted */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{avertedSize ? formatCurrency(avertedSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`col-span-2 text-md ${avertedPriceColor}`}>
					{formatCurrency(avertedAvgPriceZchf, 2, 2)} {position.zchfSymbol}
				</div>
				{/* <div className={`col-span-2 text-md ${avertedPriceColor}`}>{formatCurrency(avertedAvgPriceZchf * zchfPrice, 2, 2)} USD</div> */}
			</div>

			{/* Succeeded */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{succeededSize ? formatCurrency(succeededSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`col-span-2 text-md ${succeededSize ? "text-green-300" : ""}`}>
					{formatCurrency(succeededAvgPriceZchf, 2, 2) ?? "-.--"} {position.zchfSymbol}
				</div>
				{/* <div className={`col-span-2 text-md ${succeededSize ? "text-green-300" : ""}`}>
					{formatCurrency(succeededAvgPriceZchf * zchfPrice, 2, 2) ?? "-.--"} USD
				</div> */}
			</div>

			{/* Maturity */}
			<div className="flex flex-col gap-4 -ml-2">
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] bg-layout-primary`}>{startString}</div>
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] text-gray-900 ${maturityStatusColors}`}>
					{expiration > 0 ? expirationString : "Matured"}
				</div>
			</div>
		</TableRow>
	);
}
