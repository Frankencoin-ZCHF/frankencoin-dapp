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
import Link from "next/link";
import DisplayCollateralChallenge from "./DisplayCollateralChallenge";

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
	const time2exp: number = Math.round(((maturity - Date.now()) / 1000 / 60 / 60) * 10) / 10; // time to expiration

	const isQuickAuction = start + 2 * duration > maturity;
	const declineStartTimestamp = isQuickAuction ? start : start + duration;

	const states: string[] = ["Phase 1", "Phase 2"];
	let stateIdx: number = 0;
	let stateTimeLeft: string = "";

	if (time2exp < 0) {
		stateIdx = 1;
		stateTimeLeft = "Matured";
	} else if (declineStartTimestamp > Date.now()) {
		stateIdx = 0;
		const diff: number = declineStartTimestamp - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateTimeLeft = `${d}d ${h}h ${m}m`;
	} else {
		stateIdx = 1;
		const diff: number = maturity - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateTimeLeft = `${d}d ${h}h ${m}m`;
	}

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
		<TableRow
			actionCol={
				<Link href={`/challenges/${challenge.number}/bid`} className="btn btn-primary w-full h-10">
					Make a Bid
				</Link>
			}
		>
			{/* Collateral */}
			<div>
				<DisplayCollateralChallenge
					position={position}
					challenge={challenge}
					collateralPrice={collTokenPrice}
					zchfPrice={zchfPrice}
					challengeSize={challengeSize}
					challengeSizeZchf={challengeSizeZchf}
				/>
			</div>

			{/* remaining */}
			<div className="flex flex-col">
				<div className="text-mg font-bold text-text-header">
					{challengeRemainingSize > 0 ? formatCurrency(challengeRemainingSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`text-sm ${challengeAuctionPriceColor}`}>
					{formatCurrency(challengeRemainingPriceZchf, 2, 2) || "0.00"} {position.zchfSymbol}
				</div>
			</div>

			{/* Averted */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">
					{avertedSize ? formatCurrency(avertedSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`text-sm`}>
					{formatCurrency(avertedAvgPriceZchf, 2, 2)} {position.zchfSymbol}
				</div>
			</div>

			{/* Succeeded */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">
					{succeededSize ? formatCurrency(succeededSize, 2, 2) : "-.--"} {position.collateralSymbol}
				</div>
				<div className={`text-sm`}>
					{formatCurrency(succeededAvgPriceZchf, 2, 2) ?? "-.--"} {position.zchfSymbol}
				</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">{states[stateIdx]}</div>
				<div className={`text-sm`}>{stateTimeLeft}</div>
			</div>
		</TableRow>
	);
}
