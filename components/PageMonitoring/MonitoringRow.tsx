import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryItem } from "@deuro/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useRouter as useNavigation } from "next/navigation";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import { useTranslation } from "next-i18next";

interface Props {
	headers: string[];
	position: PositionQuery;
	tab: string;
}

export default function MonitoringRow({ headers, position, tab }: Props) {
	const navigate = useNavigation();
	const { t } = useTranslation();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const bids = useSelector((state: RootState) => state.bids.positions);
	const url = useContractUrl(position.collateral || zeroAddress);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const deuroPrice = prices[position.deuro.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !deuroPrice) return null;

	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceDEURO: number = Math.round(((balance * collTokenPrice) / deuroPrice) * 100) / 100;

	const liquidationDEURO: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationPct: number = Math.round((balanceDEURO / (liquidationDEURO * balance)) * 10000) / 100;

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
			actionCol={
				<Button
					className="h-10"
					onClick={() => navigate.push(`/monitoring/${position.position}/${maturity <= 0 ? "forceSell" : "challenge"}`)}
				>
					{maturity <= 0 ? t("monitoring.force_sell") : t("monitoring.challenge")}
				</Button>
			}
			tab={tab}
			showFirstHeader={true}
		>
			{/* Collateral */}
			<div className="flex flex-col">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center">
					<span className="mr-3 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className={`col-span-2 text-md font-extrabold text-text-primary`}>{`${formatCurrency(balance)} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<div className="md:hidden flex flex-row items-center py-1 mb-3">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md text-text-primary font-semibold`}>{`${formatCurrency(balance)} ${
						position.collateralSymbol
					}`}</div>
				</div>
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
					{maturity < 3
						? maturity > 0
							? `${formatCurrency(maturity * 24)} hours`
							: "Expired"
						: `${formatCurrency(Math.round(maturity))} days`}
				</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md`}>{challengesRatioPct == 0 ? "-" : `${challengesRatioPct}%`}</div>
			</div>
		</TableRow>
	);
}
