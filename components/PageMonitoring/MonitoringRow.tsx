import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, normalizeAddress } from "../../utils/format";
import { useRouter } from "next/navigation";
import { useContractUrl } from "@hooks";
import ButtonSecondary from "@components/ButtonSecondary";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQuery;
}

export default function MonitoringRow({ headers, tab, position }: Props) {
	const router = useRouter();
	const isFirstTabActive = headers[0] === tab;

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const url = useContractUrl(position.collateral || zeroAddress);
	const collTokenPrice = prices[normalizeAddress(position.collateral)]?.price?.usd || 1;
	const zchfPrice = prices[normalizeAddress(position.zchf)]?.price?.usd || 1;

	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationPct: number = Math.round((balanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;

	const digits: number = position.collateralDecimals;
	const positionChallenges = challenges.map[normalizeAddress(position.position)] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status === "Active");
	const positionChallengesActiveCollateral =
		positionChallengesActive.reduce<number>((acc, c) => {
			return acc + parseInt(formatUnits(c.size, digits - 2)) - parseInt(formatUnits(c.filledSize, digits - 2));
		}, 0) / 100;
	const collateralBalanceNumber: number = parseInt(formatUnits(BigInt(position.collateralBalance), digits - 2)) / 100;
	const challengesRatioPct: number = Math.round((positionChallengesActiveCollateral / collateralBalanceNumber) * 100);

	const collColor = liquidationPct < 110 ? "text-red-500" : liquidationPct <= 120 ? "text-orange-400" : "text-green-500";
	const rowBg =
		liquidationPct < 110
			? "bg-[#FEF2F2] border-l-[3px] border-l-[#E5484D]"
			: liquidationPct <= 120
			? "bg-[#FFFBEB] border-l-[3px] border-l-[#F59E0B]"
			: "";

	return (
		<TableRow
			headers={headers}
			tab={tab}
			className={rowBg}
			actionCol={
				<ButtonSecondary
					className="h-10"
					onClick={() => router.push(`/monitoring/${position.position}/${maturity <= 0 ? "forceSell" : "challenge"}`)}
				>
					{maturity <= 0 ? "Force Sell" : "Challenge"}
				</ButtonSecondary>
			}
		>
			{/* Collateral */}
			<div className="flex flex-col max-md:mb-5">
				<div className="max-md:hidden md:-ml-12 flex items-center">
					<span className="mr-4 cursor-pointer" onClick={() => window.open(url, "_blank")}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<div className="flex flex-col text-left">
						<span className="text-md font-bold">{`${formatCurrency(balance)} ${position.collateralSymbol}`}</span>
						<span className="text-text-subheader font-normal text-sm max-lg:w-[8rem] lg:w-[10rem] max-sm:w-[12rem] md:text-nowrap truncate">
							{position.collateralName}
						</span>
					</div>
				</div>

				<div className="md:hidden flex flex-row items-center">
					<div className="mr-4 cursor-pointer" onClick={() => window.open(url, "_blank")}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className="flex flex-col text-left">
						<span className="text-md font-bold">{`${formatCurrency(balance)} ${position.collateralSymbol}`}</span>
						<span className="text-text-subheader font-normal text-sm">{position.collateralName}</span>
					</div>
				</div>
			</div>

			{/* Price */}
			<div className="flex flex-col">
				<div className={`text-md font-bold`}>{formatCurrency(liquidationZCHF)} ZCHF</div>
				<div className={`text-sm font-normal text-text-subheader`}>per {position.collateralSymbol}</div>
			</div>

			{/* Coll. */}
			<div className="flex flex-col gap-2">
				<div className={`text-md font-bold ${collColor}`}>{!isNaN(liquidationPct) ? formatCurrency(liquidationPct) : "-.--"}%</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col">
				{challengesRatioPct === 0 ? (
					<span className="text-md">-</span>
				) : (
					<>
						<span className="text-md font-bold">{challengesRatioPct}%</span>
						<span className="text-text-subheader text-sm">
							{formatCurrency(positionChallengesActiveCollateral, 2, 2)} {position.collateralSymbol}
						</span>
					</>
				)}
			</div>

			{/* Expiration */}
			<div className="flex flex-col">
				<span className="text-md">
					{new Date(position.expiration * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
				</span>
				<span className={`text-sm ${maturity < 7 ? "text-text-warning font-bold" : "text-text-subheader"}`}>
					{maturity <= 0 ? "Expired" : maturity < 3 ? `${Math.round(maturity * 24)}h` : `${Math.round(maturity)}d`}
				</span>
			</div>
		</TableRow>
	);
}
