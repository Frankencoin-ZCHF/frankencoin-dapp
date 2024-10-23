import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { ChallengesId, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { useContractUrl } from "@hooks";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	challenge: ChallengesQueryItem;
}

export default function ChallengesRow({ headers, challenge }: Props) {
	const navigate = useNavigation();

	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challengesPrices = useSelector((state: RootState) => state.challenges.challengesPrices);
	const bidsChallenges = useSelector((state: RootState) => state.bids.challenges);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const challengePrice: bigint = BigInt(challengesPrices.map[challenge.id as ChallengesId] ?? 1);
	if (challengePrice == undefined) return null;

	// Maturity
	const start: number = parseInt(challenge.start.toString()) * 1000; // timestap
	const since: number = Math.round(((Date.now() - start) / 1000 / 60 / 60) * 10) / 10; // since timestamp to now

	const duration: number = parseInt(challenge.duration.toString()) * 1000;
	const maturity: number = Math.min(...[position.expiration * 1000, start + 2 * duration]); // timestamp
	const time2exp: number = Math.round(((maturity - Date.now()) / 1000 / 60 / 60) * 10) / 10; // time to expiration

	const isQuickAuction = start + 2 * duration > maturity;
	const declineStartTimestamp = isQuickAuction ? start : start + duration;

	const states: string[] = ["Fixed Price", "Declining Price", "Zero Price"];
	let stateIdx: number = 0;
	let stateTimeLeft: string = "";

	if (time2exp < 0) {
		stateIdx = 2;
		stateTimeLeft = "-";
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

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/challenges/${challenge.id}/bid`)}>
					Buy
				</Button>
			}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center -ml-12">
					<span className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md text-text-primary`}>{`${formatCurrency(challengeRemainingSize)} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md text-text-primary font-semibold`}>{`${formatCurrency(challengeRemainingSize)} ${
						position.collateralSymbol
					}`}</div>
				</AppBox>
			</div>

			{/* Current Price */}
			<div className="flex flex-col">
				<div className="text-md text-text-primary">
					{formatCurrency(formatUnits(challengePrice, 36 - position.collateralDecimals), 2, 2)} ZCHF
				</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md text-text-primary">{states[stateIdx]}</div>
			</div>

			{/* Time Left */}
			<div className="flex flex-col">
				<div className={`text-md text-text-primary`}>{stateTimeLeft}</div>
			</div>
		</TableRow>
	);
}
