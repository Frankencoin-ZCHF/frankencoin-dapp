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

	return (
		<TableRow link={`/position/${position.position}/challenge`}>
			<div className="flex flex-col">
				<div className="col-span-2 w-16 h-16 max-h-16 max-w-16 rounded-xl my-auto">
					<TokenLogo currency={position.collateralSymbol.toLowerCase()} size={16} />
				</div>
				<div>
					<div className="text-sm font-bold text-text-subheader w-16 text-center">{position.collateralSymbol}</div>
				</div>
			</div>
			<div>{interest} %</div>
			<div>{reserve} %</div>
			<div>{formatCurrency(available.toString(), 2)} ZCHF</div>
			<div>{price} ZCHF</div>
			<div className="flex flex-col gap-4">
				<Badge className="w-[8rem] text-center flex-col" color="gray">
					{`Since ${since} days`}
				</Badge>
				<Badge className="w-[8rem] text-center flex-col" color={`${maturity < 50 ? "red" : "green"}`}>
					{maturity > 0 ? `Exp. in ${maturity} days` : "Matured"}
				</Badge>
			</div>
		</TableRow>
	);
}
