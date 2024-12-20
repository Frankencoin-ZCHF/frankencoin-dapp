import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryItem } from "@deuro/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../utils/format";
import MyPositionsDisplayCollateral from "./MyPositionsDisplayCollateral";
import { useRouter as useNavigate } from "next/navigation";
import Button from "@components/Button";
import AppBox from "@components/AppBox";
import { TOKEN_SYMBOL } from "@utils";

interface Props {
	headers: string[];
	subHeaders: string[];
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

export default function MypositionsRow({ headers, subHeaders, position }: Props) {
	const navigate = useNavigate();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const bids = useSelector((state: RootState) => state.bids.positions);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const deuroPrice = prices[position.deuro.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !deuroPrice) return null;

	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const balance: number = parseInt(position.collateralBalance) / 10 ** position.collateralDecimals;
	const balanceDEURO: number = (balance * collTokenPrice) / deuroPrice;

	const loanDEURO: number = parseInt(position.minted) / 10 ** position.deuroDecimals;

	const liquidationDEURO: number = parseInt(position.price) / 10 ** (36 - position.collateralDecimals);
	const liquidationPct: number = (balanceDEURO / (liquidationDEURO * balance)) * 100;

	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];

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
			if (maturity < 3) {
				stateTimePrint = `${formatCurrency(maturity * 24)} hours`;
			} else {
				stateTimePrint = `${formatCurrency(Math.round(maturity))} days`;
			}
		} else {
			stateIdx = 5;
			stateTimePrint = ``;
		}
	} else {
		stateIdx = 6;
		stateTimePrint = `${Math.round(maturity)} days`;
	}

	function navigateToChallenge() {
		if (stateIdx != 1) return;

		try {
			navigate.push(`challenges/${stateChallengeInfo.challenge.number}/bid`, { scroll: true });
		} catch (error) {
			console.log(error);
		}
	}

	return (
		<TableRow
			headers={headers}
			subHeaders={subHeaders}
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/mypositions/${position.position}/adjust`)}>
					Manage
				</Button>
			}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden">
					<MyPositionsDisplayCollateral position={position} collateralPrice={collTokenPrice} deuroPrice={deuroPrice} />
				</div>
				{/* mobile view */}
				<AppBox className="md:hidden">
					<MyPositionsDisplayCollateral
						className={"justify-items-center items-center"}
						position={position}
						collateralPrice={collTokenPrice}
						deuroPrice={deuroPrice}
					/>
				</AppBox>
			</div>

			{/* Liquidation */}
			<div className="flex flex-col">
				<span className={liquidationPct < 110 ? `text-md font-bold text-text-warning` : "text-md text-text-primary"}>
					{formatCurrency(liquidationDEURO, 2, 2)} {TOKEN_SYMBOL}
				</span>
				<span className="text-sm text-text-subheader">{formatCurrency(collTokenPrice / deuroPrice, 2, 2)} {TOKEN_SYMBOL}</span>
			</div>

			{/* Loan Value */}
			<div className="flex flex-col">
				<span className="text-md text-text-primary">{formatCurrency(loanDEURO, 2, 2)} {TOKEN_SYMBOL}</span>
				<span className="text-sm text-text-subheader">{formatCurrency(balance * liquidationDEURO - loanDEURO, 2, 2)} {TOKEN_SYMBOL}</span>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className={`text-md ${stateIdx != 6 ? "text-text-warning font-bold" : "text-text-primary "}`}>{states[stateIdx]}</div>
				<div
					className={`text-sm text-text-subheader ${stateIdx == 1 ? "underline cursor-pointer" : ""}`}
					onClick={navigateToChallenge}
				>
					{stateTimePrint}
				</div>
			</div>
		</TableRow>
	);
}
