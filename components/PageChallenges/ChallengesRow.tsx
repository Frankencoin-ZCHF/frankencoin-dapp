import { Address, formatUnits, parseEther, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { ChallengesId, ChallengesQueryItem } from "@deuro/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { useContractUrl } from "@hooks";
import AppBox from "@components/AppBox";
import { TOKEN_SYMBOL } from "@utils";

interface Props {
	headers: string[];
	challenge: ChallengesQueryItem;
	tab: string;
}

export default function ChallengesRow({ headers, challenge, tab }: Props) {
	const navigate = useNavigation();

	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challengesPrices = useSelector((state: RootState) => state.challenges.challengesPrices);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const deuroPrice = prices[position.deuro.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !deuroPrice) return null;

	const challengePriceSearch: string | undefined = challengesPrices.map[challenge.id as ChallengesId];
	const challengePrice: string = formatUnits(BigInt(challengePriceSearch ?? "0"), 36 - position.collateralDecimals);
	const start: number = parseInt(challenge.start.toString()) * 1000; // timestamp
	const duration: number = parseInt(challenge.duration.toString()) * 1000;

	const timeToExpiration = start >= position.expiration * 1000 ? 0 : position.expiration * 1000 - start;
	const phase1 = Math.min(timeToExpiration, duration);

	const declineStartTimestamp = start + phase1;
	const zeroPriceTimestamp = start + phase1 + duration;

	const states: string[] = ["Fixed Price", "Declining Price", "Zero Price"];
	let stateIdx: number = 0;
	let stateTimeLeft: string = "";

	if (zeroPriceTimestamp < Date.now()) {
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
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/challenges/${challenge.id}/bid`)}>
					Buy
				</Button>
			}
			tab={tab}
			showFirstHeader
		>
			{/* Collateral */}
			<div className="flex flex-col">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center">
					<span className="mr-3 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md font-extrabold text-text-primary`}>{`${formatCurrency(challengeRemainingSize)} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<div className="md:hidden flex flex-row items-center py-1 mb-3">
					<div className="mr-3 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md text-text-primary font-semibold`}>{`${formatCurrency(challengeRemainingSize)} ${
						position.collateralSymbol
					}`}</div>
				</div>
			</div>

			{/* Current Price */}
			<div className="flex flex-col">
				<div className="text-md">
					{challengePriceSearch ? formatCurrency(challengePrice, 2, 2) : "(pending)"} {TOKEN_SYMBOL}
				</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md">{states[stateIdx]}</div>
			</div>

			{/* Time Left */}
			<div className="flex flex-col">
				<div className={`text-md`}>{stateTimeLeft}</div>
			</div>
		</TableRow>
	);
}
