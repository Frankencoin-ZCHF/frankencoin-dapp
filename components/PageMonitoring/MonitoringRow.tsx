import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, ChallengesQueryItem } from "@deuro/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import { useRouter as useNavigation } from "next/navigation";
import { useRouter } from "next/router";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import { useTranslation } from "next-i18next";
import { getCarryOnQueryParams, TOKEN_SYMBOL, toQueryString } from "@utils";

interface Props {
	headers: string[];
	position: PositionQuery;
	tab: string;
}

export default function MonitoringRow({ headers, position, tab }: Props) {
	const navigate = useNavigation();
	const router = useRouter();
	const { t } = useTranslation();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const challenges = useSelector((state: RootState) => state.challenges.positions);
	const url = useContractUrl(position.collateral || zeroAddress);
	const maturity: number = (position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24;

	const collBalancePosition: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const collTokenPriceMarket = prices[position.collateral.toLowerCase() as Address]?.price?.eur || 0;
	const collTokenPricePosition: number =
		Math.round((parseInt(position.virtualPrice || position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;

	const marketValueCollateral: number = collBalancePosition * collTokenPriceMarket;
	const positionValueCollateral: number = collBalancePosition * collTokenPricePosition;
	const collateralizationPercentage: number = Math.round((marketValueCollateral / positionValueCollateral) * 10000) / 100;

	const digits: number = position.collateralDecimals;
	const positionChallenges = challenges.map[position.position.toLowerCase() as Address] ?? [];
	const positionChallengesActive = positionChallenges.filter((ch: ChallengesQueryItem) => ch.status == "Active") ?? [];
	const positionChallengesActiveCollateral =
		positionChallengesActive.reduce<number>((acc, c) => {
			return acc + parseInt(formatUnits(c.size, digits - 2)) - parseInt(formatUnits(c.filledSize, digits - 2));
		}, 0) / 100;
	const collateralBalanceNumber: number = parseInt(formatUnits(BigInt(position.collateralBalance), digits - 2)) / 100;
	const challengesRatioPct: number = Math.round((positionChallengesActiveCollateral / collateralBalanceNumber) * 100);

	const liquidationPrice = formatCurrency(
		Math.round((parseInt(position.virtualPrice || position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100, 
		2,
		2
	);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			headers={headers}
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/monitoring/${position.position}${toQueryString(getCarryOnQueryParams(router))}`)}>
					{t("common.details")}
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
					<span className={`col-span-2 text-md font-extrabold text-text-primary`}>{`${formatCurrency(collBalancePosition)} ${
						position.collateralSymbol
					}`}</span>
				</div>

				{/* mobile view */}
				<div className="md:hidden flex flex-row items-center py-1 mb-3">
					<div className="mr-4 cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</div>
					<div className={`col-span-2 text-md text-text-primary font-semibold`}>{`${formatCurrency(collBalancePosition)} ${
						position.collateralSymbol
					}`}</div>
				</div>
			</div>

			{/* Liquidation price */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md`}>
					{liquidationPrice} {TOKEN_SYMBOL}
				</div>
			</div>

			{/* Coll. */}
			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${collateralizationPercentage < 110 ? "text-text-warning font-bold" : ""}`}>
					{!isNaN(collateralizationPercentage) ? formatCurrency(collateralizationPercentage) : "-.--"}%
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
		</TableRow>
	);
}
