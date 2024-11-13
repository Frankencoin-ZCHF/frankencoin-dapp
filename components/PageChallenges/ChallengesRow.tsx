import { Address, formatUnits, parseEther, zeroAddress } from "viem";
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

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const challengePrice: bigint = BigInt(challengesPrices.map[challenge.id as ChallengesId] ?? parseEther("1"));
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
