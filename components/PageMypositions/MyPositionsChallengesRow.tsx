import { Address, formatUnits, parseEther, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { BidsQueryType, ChallengesId, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useContractUrl } from "@hooks";
import MyPositionsChallengesCancel from "./MyPositionsChallengesCancel";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	challenge: ChallengesQueryItem;
}

export default function MyPositionsChallengesRow({ headers, tab, challenge }: Props) {
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const bids = useSelector((state: RootState) => state.bids.challenges.map[challenge.id]);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const start: number = parseInt(challenge.start.toString()) * 1000; // timestap
	const duration: number = parseInt(challenge.duration.toString()) * 1000;

	const timeToExpiration = start >= position.expiration * 1000 ? 0 : position.expiration * 1000 - start;
	const phase1 = Math.min(timeToExpiration, duration);

	const declineStartTimestamp = start + phase1;
	const zeroPriceTimestamp = start + phase1 + duration;

	let stateIdx: number = 0;

	if (zeroPriceTimestamp < Date.now()) {
		stateIdx = 1;
	} else if (declineStartTimestamp > Date.now()) {
		stateIdx = 0;
	} else {
		stateIdx = 1;
	}

	const challengeSize: number = parseInt(challenge.size.toString()) / 10 ** position.collateralDecimals;

	const avertedSize: number =
		(parseInt(challenge.filledSize.toString()) - parseInt(challenge.acquiredCollateral.toString())) / 10 ** position.collateralDecimals;

	const avertedRatio: number = avertedSize / challengeSize;

	const succeededSize: number = parseInt(challenge.acquiredCollateral.toString()) / 10 ** position.collateralDecimals;

	const succeededRatio: number = succeededSize / challengeSize;

	const allProceeds = bids.reduce((a, b) => (b.bidType == BidsQueryType.Averted ? a + parseFloat(formatUnits(b.bid, 18)) : a), 0);
	const allRewards = bids.reduce((a, b) => (b.bidType == BidsQueryType.Succeeded ? a + parseFloat(formatUnits(b.bid, 18)) * 0.02 : a), 0);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={stateIdx == 1 ? <></> : <MyPositionsChallengesCancel challenge={challenge} hidden={stateIdx == 1} />}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center -ml-12">
					<span className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md`}>{`${formatCurrency(challengeSize, 2, 2)} ${position.collateralSymbol}`}</span>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md`}>{`${formatCurrency(challengeSize)} ${position.collateralSymbol}`}</div>
				</AppBox>
			</div>

			{/* Averted Ratio */}
			<div className="flex flex-col">
				<div className="text-md">{formatCurrency(avertedRatio * 100, 2, 2)}%</div>
			</div>

			{/* All Proceeds */}
			<div className="flex flex-col">
				<div className="text-md">{formatCurrency(allProceeds, 2, 2)} ZCHF</div>
			</div>

			{/* Succeeded Ratio */}
			<div className="flex flex-col">
				<div className="text-md">{formatCurrency(succeededRatio * 100, 2, 2)}%</div>
			</div>

			{/* All Rewards */}
			<div className="flex flex-col">
				<div className="text-md">{formatCurrency(allRewards, 2, 2)} ZCHF</div>
			</div>
		</TableRow>
	);
}
