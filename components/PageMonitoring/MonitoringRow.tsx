import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryStatus, BidsQueryItem, BidsQueryType, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import Link from "next/link";
import { useContractUrl } from "@hooks";

interface Props {
	position: PositionQuery;
}

export default function MonitoringRow({ position }: Props) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const bids = useSelector((state: RootState) => state.bids.positions);
	const url = useContractUrl(position.collateral || zeroAddress);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;
	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
	const maturity: number = Math.round((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);
	const maturityStatusColors = maturity > 60 ? "text-green-300" : maturity < 30 ? "text-red-500" : "text-red-300";

	const startStr = new Date(position.start * 1000).toDateString().split(" ");
	const startString: string = `${startStr[2]} ${startStr[1]} ${startStr[3]} (${since}d)`;

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]} (${maturity}d)`;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const ballanceUSD: number = Math.round(balance * collTokenPrice * 100) / 100;

	const loanZCHF: number = Math.round((parseInt(position.minted) / 10 ** position.zchfDecimals) * 100) / 100;
	const loanUSD: number = Math.round(loanZCHF * zchfPrice * 100) / 100;
	const loanPct: number = Math.round((loanZCHF / balanceZCHF) * 10000) / 100;
	const loanStatusColors = loanPct > 100 ? "bg-red-300" : loanPct > 10000 / 120 ? "bg-blue-300" : "bg-green-300";

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationUSD: number = Math.round(liquidationZCHF * zchfPrice * 100) / 100;
	const liquidationPct: number = Math.round((balanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;
	const liauidationStatusColors = liquidationPct < 100 ? "text-red-500" : liquidationPct < 120 ? "text-red-300" : "text-green-300";

	const digits: number = position.collateralDecimals;
	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];
	const positionChallengesActiveCollateral =
		positionChallengesActive.reduce<number>((acc, c) => {
			return acc + parseInt(formatUnits(c.size, digits - 2)) - parseInt(formatUnits(c.filledSize, digits - 2));
		}, 0) / 100;
	const collateralBalanceNumber: number = parseInt(formatUnits(BigInt(position.collateralBalance), digits - 2)) / 100;
	const challengesRatioPct: number = Math.round((positionChallengesActiveCollateral / collateralBalanceNumber) * 100);

	const positionChallengesBids = bids.map[position.position.toLowerCase() as Address] ?? [];
	const positionBidsAverted = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Averted");
	const positionBidsSucceeded = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Succeeded");

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			actionCol={
				<Link href={`/monitoring/${position.position}/challenge`} className="btn btn-primary w-full h-10">
					Challenge
				</Link>
			}
		>
			{/* Collateral */}
			<div className="-ml-4 gap-3 flex items-center">
				<div onClick={openExplorer}>
					<TokenLogo currency={position.collateralSymbol} />
				</div>
				<div className={`col-span-2 text-md`}>{`${formatCurrency(balance, 2, 2)} ${position.collateralSymbol}`}</div>
			</div>

			{/* Coll. */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${liquidationPct < 110 ? "text-red-700 font-bold" : "text-text-header"}`}>
					{!isNaN(liquidationPct) ? liquidationPct : "-.--"}%
				</div>
			</div>

			{/* Expiration */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${maturity < 7 ? "text-red-700 font-bold" : ""}`}>
					{maturity < 3 ? (maturity > 0 ? `${Math.round(maturity * 24)} hours` : "Expired") : `${maturity} days`}
				</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${challengesRatioPct > 0 ? "text-red-700 font-bold" : ""}`}>
					{challengesRatioPct == 0 ? "-" : `${challengesRatioPct}%`}
				</div>
			</div>
		</TableRow>
	);
}
