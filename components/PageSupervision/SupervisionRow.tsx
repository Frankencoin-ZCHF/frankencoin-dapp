import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { Badge } from "flowbite-react";
import { PositionQuery } from "../../redux/slices/positions.types";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";

interface Props {
	position: PositionQuery;
}

export default function SupervisionRow({ position }: Props) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;
	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
	const maturity: number = Math.round((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);
	const maturityStatusColors = maturity < 60 ? "bg-red-500" : maturity < 30 ? "bg-orange-400" : "bg-green-500";

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const ballanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const ballanceUSD: number = Math.round(balance * collTokenPrice * 100) / 100;

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationUSD: number = Math.round(liquidationZCHF * zchfPrice * 100) / 100;
	const liquidationPct: number = Math.round((ballanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;
	const liauidationStatusColors = liquidationPct < 100 ? "bg-red-500" : liquidationPct < 150 ? "bg-orange-400" : "bg-green-500";

	return (
		<TableRow link={`/position/${position.position}/challenge`}>
			{/* Collateral */}
			<div className="flex flex-col gap-4">
				<div className="col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
					<TokenLogo currency={position.collateralSymbol.toLowerCase()} size={16} />
				</div>
				<div>
					<div className="text-sm font-bold text-text-subheader w-16 text-center">{position.collateralSymbol}</div>
				</div>
			</div>

			{/* Balance */}
			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-lg font-bold text-text-header">
					{formatCurrency(balance, 2, 2)} {position.collateralSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(ballanceZCHF, 2, 2)} {position.zchfSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">{formatCurrency(ballanceUSD, 2, 2)} USD</div>
			</div>

			{/* Liquidation */}
			<div className="flex flex-col gap-2">
				<div className={`rounded-full text-center max-h-14 max-w-[8rem] font-bold text-gray-900 ${liauidationStatusColors}`}>
					{liquidationPct}%
				</div>
				<div className="col-span-2 text-md text-text-subheader">
					{formatCurrency(liquidationZCHF, 2, 2)} {position.zchfSymbol}
				</div>
				<div className="col-span-2 text-md text-text-subheader">{formatCurrency(liquidationUSD, 2, 2)} USD</div>
			</div>

			{/* Challenges */}
			<div className="flex flex-col gap-2 -ml-2">
				<div className={`rounded-full text-center max-h-14 max-w-[8rem] font-bold`}>[in dev.]</div>
				{/* <div className={`rounded-full text-center max-h-14 max-w-[8rem] font-bold text-gray-900 ${maturityStatusColors}`}>-- %</div>
				<div className="col-span-2 text-md text-text-subheader">-- {position.zchfSymbol}</div>
				<div className="col-span-2 text-md text-text-subheader">-- USD</div> */}
			</div>

			{/* Maturity */}
			<div className="flex flex-col gap-2 -ml-2">
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] font-bold bg-layout-primary`}>
					{new Date(position.start * 1000).toDateString()}
				</div>
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] bg-layout-primary`}>{`(since ${since} days)`}</div>
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] text-gray-900 font-bold ${maturityStatusColors}`}>
					<div>{new Date(position.expiration * 1000).toDateString()}</div>
				</div>
				<div className={`rounded-full text-center max-h-14 max-w-[10rem] text-gray-900 ${maturityStatusColors}`}>
					{maturity > 0 ? `(in ${maturity} days)` : "(matured)"}
				</div>
			</div>
		</TableRow>
	);
}
