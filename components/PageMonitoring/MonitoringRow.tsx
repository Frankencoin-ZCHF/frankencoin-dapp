import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryStatus, BidsQueryItem, BidsQueryType, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useRouter as useNavigation } from "next/navigation";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQuery;
}

export default function MonitoringRow({ headers, tab, position }: Props) {
	const navigate = useNavigation();
	const isFirstTabActive = headers[0] === tab;

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const url = useContractUrl(position.collateral || zeroAddress);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd || 1;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd || 1;

	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationPct: number = Math.round((balanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;

	const digits: number = position.collateralDecimals;
	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];
	const positionChallengesActiveCollateral =
		positionChallengesActive.reduce<number>((acc, c) => {
			return acc + parseInt(formatUnits(c.size, digits - 2)) - parseInt(formatUnits(c.filledSize, digits - 2));
		}, 0) / 100;
	const collateralBalanceNumber: number = parseInt(formatUnits(BigInt(position.collateralBalance), digits - 2)) / 100;
	const challengesRatioPct: number = Math.round((positionChallengesActiveCollateral / collateralBalanceNumber) * 100);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={
				<Button
					className="h-10"
					onClick={() => navigate.push(`/monitoring/${position.position}/${maturity <= 0 ? "forceSell" : "challenge"}`)}
				>
					{maturity <= 0 ? "Force Sell" : "Challenge"}
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
					<span className={`col-span-2 text-md text-text-primary`}>
						{`${formatCurrency(balance)} ${position.collateralSymbol}`}
						<span className="text-sm">{position.version == 2 ? " v2" : " v1"}</span>
					</span>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md ${isFirstTabActive ? "text-text-primary" : ""} font-semibold`}>
						{`${formatCurrency(balance)} ${position.collateralSymbol}`}
						<span className="text-sm font-normal">{position.version == 2 ? " v2" : " v1"}</span>
					</div>
				</AppBox>
			</div>

			{/* Coll. */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${liquidationPct < 110 ? "text-text-warning font-bold" : ""}`}>
					{!isNaN(liquidationPct) ? formatCurrency(liquidationPct) : "-.--"}%
				</div>
			</div>

			{/* Expiration */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${maturity < 7 ? "text-text-warning font-bold" : ""}`}>
					{maturity < 3 ? (maturity > 0 ? `${formatCurrency(maturity * 24)} hours` : "Expired") : `${Math.round(maturity)} days`}
				</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md`}>{challengesRatioPct == 0 ? "-" : `${challengesRatioPct}%`}</div>
			</div>
		</TableRow>
	);
}
