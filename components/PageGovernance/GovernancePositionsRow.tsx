import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { formatCurrency, FormatType } from "../../utils/format";
import { useContractUrl } from "@hooks";
import GovernancePositionsAction from "./GovernancePositionsAction";
import GovernancePositionsRowType from "./GovernancePositionsRowType";

interface Props {
	position: PositionQuery;
	prices: PriceQueryObjectArray;
}

export default function GovernancePositionsRow({ position, prices }: Props) {
	const urlPosition = useContractUrl(position.position || zeroAddress);
	const urlCollateral = useContractUrl(position.collateral || zeroAddress);
	const price = prices[position.collateral.toLowerCase() as Address];
	if (!position || !price) return null;

	const openPosition = (e: any) => {
		e.preventDefault();
		window.open(urlPosition, "_blank");
	};
	const openCollateral = (e: any) => {
		e.preventDefault();
		window.open(urlCollateral, "_blank");
	};

	const symbol = position.collateralSymbol;
	const initialCollateral = formatUnits(BigInt(position.minimumCollateral), position.collateralDecimals);

	const limit = formatUnits(BigInt(position.limitForClones), 18);
	const liqPrice = formatUnits(BigInt(position.price), 36 - position.collateralDecimals) ?? "1";

	const maturity = (position.expiration - position.start) / 60 / 60 / 24 / 30;
	const denyUntil = (position.start * 1000 - Date.now()) / 1000 / 60 / 60;

	// effectiveLTV = liquidation price * (1 - reserve) / market price
	const ltv = (parseInt(liqPrice) * (1 - position.reserveContribution / 1_000_000)) / (price.price.chf || 1);

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernancePositionsAction key={position.position} position={position} />
				</div>
			}
		>
			<div className="flex items-center">
				<GovernancePositionsRowType position={position} />
			</div>

			<div className="flex flex-col">
				<span className="text-sm">
					{formatCurrency(initialCollateral)} <span className="text-xs">{symbol}</span>
				</span>
				<span className={`text-sm ${ltv > 1 ? "text-red-500" : ""}`}>{formatCurrency(ltv * 100)}%</span>
			</div>

			<div className="flex flex-col">
				<span className="text-sm">
					{formatCurrency(limit)} <span className="text-xs">ZCHF</span>
				</span>
				<span className="text-sm">
					{formatCurrency(liqPrice)} <span className="text-xs">{symbol}</span>
				</span>
			</div>

			<div className="">{formatCurrency(position.annualInterestPPM / 10_000)}%</div>

			<div className="flex flex-col">
				<span className="text-sm">{formatCurrency(maturity, 1, 1, FormatType.us)} months</span>
				<span className="text-sm">{formatCurrency(position.challengePeriod / 60 / 60, 1, 1, FormatType.us)} hours</span>
			</div>

			<div className="">{formatCurrency(position.reserveContribution / 10_000, 0, 0, 0)}%</div>

			<div className="flex flex-col">
				<span className={`text-sm ${denyUntil < 10 ? "text-red-500" : ""}`}>{Math.round(denyUntil)} hours</span>
			</div>
		</TableRow>
	);
}
