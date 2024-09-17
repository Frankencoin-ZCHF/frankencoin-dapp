import { Address, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, BidsQueryItem, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../utils/format";
import MyPositionsDisplayCollateral from "./MyPositionsDisplayCollateral";
import Link from "next/link";
import { useRouter as useNavigate } from "next/navigation";
import { useContractUrl } from "@hooks";

interface Props {
	position: PositionQuery;
}

type ChallengeInfos = {
	start: number;
	duration: number;
	maturity: number;
	time2exp: number;
	isQuick: boolean;
	decline: number;
	challenge: ChallengesQueryItem;
};

export default function MypositionsRow({ position }: Props) {
	const navigate = useNavigate();
	const url = useContractUrl(position.position || zeroAddress);

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

	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];

	const positionChallengesBids = bids.map[position.position.toLowerCase() as Address] ?? [];
	const positionBidsAverted = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Averted");
	const positionBidsSucceeded = positionChallengesBids.filter((b: BidsQueryItem) => b.bidType == "Succeeded");

	const states: string[] = ["Closed", "Challenged", "New Request", "Cooldown", "Expiring Soon", "Expired", "Open"];
	let stateIdx: number = states.length;
	let stateTimePrint: string = "";
	let stateChallengeInfo: ChallengeInfos;

	if (position.closed || position.denied) {
		stateIdx = 0;
		stateTimePrint = "";
	} else if (positionChallengesActive.length > 0) {
		stateIdx = 1;

		const declineTimestamps: { [key: number]: ChallengeInfos } = {};
		for (const c of positionChallengesActive) {
			const _start: number = parseInt(c.start.toString()) * 1000; // timestap
			const _duration: number = parseInt(c.duration.toString()) * 1000; // number
			const _maturity: number = Math.min(...[position.expiration * 1000, _start + 2 * _duration]); // timestamp
			const _time2exp: number = Math.round((_maturity - Date.now()) / 1000); // number, time to expiration
			const _isQuick: boolean = _start + 2 * _duration > _maturity;
			const _decline: number = _isQuick ? _start : _start + _duration; // timestamp

			declineTimestamps[_decline] = {
				start: _start,
				duration: _duration,
				maturity: _maturity,
				time2exp: _time2exp,
				isQuick: _isQuick,
				decline: _decline,
				challenge: c,
			};
		}

		const lowestDeclineTimestamp: number = Math.min(...Object.keys(declineTimestamps).map((v) => parseInt(v)));
		stateChallengeInfo = declineTimestamps[lowestDeclineTimestamp];

		const diff: number = lowestDeclineTimestamp - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);

		stateTimePrint = diff > 0 ? `${d}d ${h}h ${m}m` : "0d 0h 0m";
	} else if (position.start * 1000 > Date.now()) {
		const diff: number = position.start * 1000 - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateIdx = 2;
		stateTimePrint = `${d}d ${h}h ${m}m`;
	} else if (position.cooldown * 1000 > Date.now()) {
		const diff: number = position.cooldown * 1000 - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateIdx = 3;
		stateTimePrint = `${d}d ${h}h ${m}m`;
	} else if (maturity < 7) {
		if (maturity > 0) {
			stateIdx = 4;
			stateTimePrint = `${maturity} days`;
		} else {
			stateIdx = 5;
			stateTimePrint = ``;
		}
	} else {
		stateIdx = 6;
		stateTimePrint = `${maturity} days`;
	}

	function navigateToChallenge() {
		if (stateIdx != 1) return;

		try {
			navigate.push(`challenges/${stateChallengeInfo.challenge.number}/bid`, { scroll: true });
		} catch (error) {
			console.log(error);
		}
	}

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			actionCol={
				<Link href={`/mypositions/${position.position}/adjust`} className="btn btn-primary w-full h-10">
					Manage
				</Link>
			}
		>
			{/* Collateral */}
			<div>
				<MyPositionsDisplayCollateral position={position} collateralPrice={collTokenPrice} zchfPrice={zchfPrice} />
			</div>

			{/* Liquidation */}
			<div className="flex flex-col">
				<span className={liquidationPct < 110 ? `text-md font-bold text-red-700` : "text-md"}>
					{formatCurrency(liquidationZCHF, 2, 2)} ZCHF
				</span>
				<span className="text-sm text-slate-500">{formatCurrency(collTokenPrice / zchfPrice, 2, 2)} ZCHF</span>
			</div>

			{/* Loan Value */}
			<div className="flex flex-col">
				<span className="text-md">{formatCurrency(loanZCHF, 2, 2)} ZCHF</span>
				<span className="text-sm text-slate-500">{formatCurrency(balance * liquidationZCHF - loanZCHF, 2, 2)} ZCHF</span>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className={`text-md ${stateIdx != 6 ? "text-red-700 font-bold" : "text-text-header "}`}>{states[stateIdx]}</div>
				<div className={`text-sm text-slate-500 ${stateIdx == 1 ? "underline cursor-pointer" : ""}`} onClick={navigateToChallenge}>
					{stateTimePrint}
				</div>
			</div>
		</TableRow>
	);
}
