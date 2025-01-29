import { Address, formatUnits, parseEther, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { ChallengesId, ChallengesQueryItem } from "@deuro/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useContractUrl } from "@hooks";
import MyPositionsChallengesCancel from "./MyPositionsChallengesCancel";
import AppBox from "@components/AppBox";
import { TOKEN_SYMBOL } from "@utils";

interface Props {
	headers: string[];
	challenge: ChallengesQueryItem;
	tab: string;
}

export default function MyPositionsChallengesRow({ headers, challenge, tab }: Props) {
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challengesPrices = useSelector((state: RootState) => state.challenges.challengesPrices);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const deuroPrice = prices[position.deuro.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !deuroPrice) return null;

	const challengePrice: bigint = BigInt(challengesPrices.map[challenge.id as ChallengesId] ?? parseEther("0"));
	const start: number = parseInt(challenge.start.toString()) * 1000; // timestap
	const duration: number = parseInt(challenge.duration.toString()) * 1000;

	const timeToExpiration = start >= position.expiration * 1000 ? 0 : position.expiration * 1000 - start;
	const phase1 = Math.min(timeToExpiration, duration);

	const declineStartTimestamp = start + phase1;
	const zeroPriceTimestamp = start + phase1 + duration;

	const states: string[] = ["Phase 1", "Phase 2"];
	let stateIdx: number = 0;
	let stateTimeLeft: string = "";

	if (zeroPriceTimestamp < Date.now()) {
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
		const diff: number = zeroPriceTimestamp - Date.now();
		const d: number = Math.floor(diff / 1000 / 60 / 60 / 24);
		const h: number = Math.floor((diff / 1000 / 60 / 60 / 24 - d) * 24);
		const m: number = Math.floor(diff / 1000 / 60 - d * 24 * 60 - h * 60);
		stateTimeLeft = `${d}d ${h}h ${m}m`;
	}

	const challengeRemainingSize: number =
		(parseInt(challenge.size.toString()) - parseInt(challenge.filledSize.toString())) / 10 ** position.collateralDecimals;

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			actionCol={<MyPositionsChallengesCancel challenge={challenge} hidden={stateIdx == 1} />}
			tab={tab}
			showFirstHeader
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center">
					<span className="mr-3 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md font-extrabold`}>{`${formatCurrency(challengeRemainingSize, 2, 2)} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<div className="md:hidden flex flex-row items-center">
					<div className="mr-3 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md  font-semibold`}>{`${formatCurrency(challengeRemainingSize)} ${
						position.collateralSymbol
					}`}</div>
				</div>
			</div>

			{/* Current Price */}
			<div className="flex flex-col">
				<div className="text-md ">
					{formatCurrency(formatUnits(challengePrice, 36 - position.collateralDecimals), 2, 2)} {TOKEN_SYMBOL}
				</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md ">{states[stateIdx]}</div>
			</div>

			{/* Time Left */}
			<div className="flex flex-col">
				<div className={`text-md `}>{stateTimeLeft}</div>
			</div>
		</TableRow>
	);
}
