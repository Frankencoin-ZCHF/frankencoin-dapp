import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryStatus, BidsQueryItem, BidsQueryType, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { BadgeCloneColor, BadgeOriginalColor } from "../../utils/customTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCertificate } from "@fortawesome/free-solid-svg-icons";

interface Props {
	position: PositionQuery;
	showMyPos?: boolean;
}

export default function SupervisionRow({ position, showMyPos }: Props) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const bids = useSelector((state: RootState) => state.bids.positions);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;
	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
	const maturity: number = Math.round((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);
	const maturityStatusColors = maturity < 60 ? "bg-red-300" : maturity < 30 ? "bg-blue-300" : "bg-green-300";

	const startStr = new Date(position.start * 1000).toDateString().split(" ");
	const startString: string = `${startStr[2]} ${startStr[1]} ${startStr[3]} (${since}d)`;

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]} (${maturity}d)`;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const ballanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const ballanceUSD: number = Math.round(balance * collTokenPrice * 100) / 100;

	const loanZCHF: number = Math.round((parseInt(position.minted) / 10 ** position.zchfDecimals) * 100) / 100;
	const loanUSD: number = Math.round(loanZCHF * zchfPrice * 100) / 100;
	const loanPct: number = Math.round((loanZCHF / ballanceZCHF) * 10000) / 100;
	const loanStatusColors = loanPct > 100 ? "bg-red-300" : loanPct > 10000 / 120 ? "bg-blue-300" : "bg-green-300";

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationUSD: number = Math.round(liquidationZCHF * zchfPrice * 100) / 100;
	const liquidationPct: number = Math.round((ballanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;
	const liauidationStatusColors = liquidationPct < 100 ? "bg-red-300" : liquidationPct < 120 ? "bg-blue-300" : "bg-green-300";

	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];

	const positionChallengesBids = bids.map[position.position.toLowerCase() as Address] ?? [];
	const positionBidsAverted = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Averted");
	const positionBidsSucceeded = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Succeeded");

	return (
		<TableRow link={showMyPos ? `/mypositions/${position.position}/adjust` : `/supervision/${position.position}/challenge`}>
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

			{/* Asset Value */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{formatCurrency(balance, 2, 2)} {position.collateralSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(ballanceZCHF, 2, 2)} {position.zchfSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">{formatCurrency(ballanceUSD, 2, 2)} USD</div>
			</div>

			{/* Loan Value */}
			<div className="flex flex-col gap-2">
				<div className={`rounded-full text-center max-h-14 max-w-[8rem] font-bold text-gray-900 ${loanStatusColors}`}>
					{!isNaN(loanPct) ? loanPct : "-.--"}%
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(loanZCHF, 2, 2)} {position.zchfSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">{formatCurrency(loanUSD, 2, 2)} USD</div>
			</div>

			{/* Liquidation */}
			<div className="flex flex-col gap-2">
				<div className={`rounded-full text-center max-h-14 max-w-[8rem] font-bold text-gray-900 ${liauidationStatusColors}`}>
					{!isNaN(liquidationPct) ? liquidationPct : "-.--"}%
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(liquidationZCHF, 2, 2)} {position.zchfSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">{formatCurrency(liquidationUSD, 2, 2)} USD</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col">
				<div className="col-span-2 text-md text-text-subheader">Active: {positionChallengesActive.length}</div>
				<div className="col-span-2 text-md text-text-subheader">Total: {positionChallenges.length}</div>
				<div className="col-span-2 text-md text-text-subheader mt-2">Averted: {positionBidsAverted.length}</div>
				<div className="col-span-2 text-md text-text-subheader">Succeeded: {positionBidsSucceeded.length}</div>
			</div>

			{/* Maturity */}
			<div className="flex flex-col gap-4 -ml-2">
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] bg-layout-primary`}>{startString}</div>
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] text-gray-900 ${maturityStatusColors}`}>
					{maturity > 0 ? expirationString : "Matured"}
				</div>
			</div>
		</TableRow>
	);
}
