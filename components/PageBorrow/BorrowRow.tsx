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

export default function BorrowRow({ position }: Props) {
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;

	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const availableK: string = formatCurrency((Math.round(available / 100) / 10).toString(), 2) + "k";
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);
	const maturity: number = Math.round((position.expiration * 1000 - Date.now()) / 1000 / 60 / 60 / 24);
	const maturityStatusColors = maturity < 60 ? "bg-red-500" : maturity < 30 ? "bg-orange-400" : "bg-green-500";

	// effectiveLTC = liquidation price * (1 - reserve) / market price
	const effectiveLTC: number = Math.round(((price * (1 - reserve / 100)) / collTokenPrice) * 10000) / 100;
	const effectiveInterest: number = Math.round((interest / (1 - reserve / 100)) * 100) / 100;

	return (
		<TableRow link={`/position/${position.position}/borrow`}>
			<div className="flex flex-col gap-4">
				<div className="col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
					<TokenLogo currency={position.collateralSymbol.toLowerCase()} size={16} />
				</div>
				<div>
					<div className="text-sm font-bold text-text-subheader w-16 text-center">{position.collateralSymbol}</div>
				</div>
			</div>
			<div>{effectiveLTC} %</div>
			<div>{effectiveInterest} %</div>
			<div>{price} ZCHF</div>
			<div>{availableK} ZCHF</div>
			<div className="flex flex-col gap-2 -ml-2">
				<div className={`rounded-full text-center max-h-14 max-w-[100] font-bold bg-layout-primary`}>
					{new Date(position.start * 1000).toDateString()}
				</div>
				<div className={`rounded-full text-center max-h-14 max-w-[100] bg-layout-primary`}>{`(since ${since} days)`}</div>
				<div className={`rounded-full text-center max-h-14 max-w-[100] text-gray-900 font-bold ${maturityStatusColors}`}>
					<div>{new Date(position.expiration * 1000).toDateString()}</div>
				</div>
				<div className={`rounded-full text-center max-h-14 max-w-[100] text-gray-900 ${maturityStatusColors}`}>
					{maturity > 0 ? `(exp. in ${maturity} days)` : "(matured)"}
				</div>
			</div>
		</TableRow>
	);
}
