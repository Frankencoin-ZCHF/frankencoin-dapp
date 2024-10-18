import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency } from "../../utils/format";
import { PositionQuery } from "@frankencoin/api";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import Button from "@components/Button";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	position: PositionQuery;
}

export default function BorrowRow({ headers, position }: Props) {
	const navigate = useNavigation();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;

	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.zchfDecimals) * 100) / 100;
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const since: number = Math.round((Date.now() - position.start * 1000) / 1000 / 60 / 60 / 24);

	const startStr = new Date(position.start * 1000).toDateString().split(" ");
	const startString: string = `${startStr[2]} ${startStr[1]} ${startStr[3]} (${since}d)`;

	const balance: number = Math.round((parseInt(position.collateralBalance) / 10 ** position.collateralDecimals) * 100) / 100;
	const balanceZCHF: number = Math.round(((balance * collTokenPrice) / zchfPrice) * 100) / 100;
	const ballanceUSD: number = Math.round(balance * collTokenPrice * 100) / 100;

	const liquidationZCHF: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const liquidationUSD: number = Math.round(liquidationZCHF * zchfPrice * 100) / 100;
	const liquidationPct: number = Math.round((balanceZCHF / (liquidationZCHF * balance)) * 10000) / 100;
	const liauidationStatusColors = liquidationPct < 100 ? "text-red-500" : liquidationPct < 120 ? "text-red-300" : "text-green-300";

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]}`;

	// effectiveLTV = liquidation price * (1 - reserve) / market price
	const effectiveLTV: number = Math.round(((price * (1 - reserve / 100)) / collTokenPrice) * zchfPrice * 10000) / 100;
	const effectiveInterest: number = Math.round((interest / (1 - reserve / 100)) * 100) / 100;

	return (
		<TableRow
			headers={headers}
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/mint/${position.position}`)}>
					Mint
				</Button>
			}
		>
			<div className="flex flex-col max-md:mb-5">
				<AppBox className="md:hidden">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
					/>
				</AppBox>
				<div className="max-md:hidden">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-text-header">
				<div className="col-span-2 text-md">{formatCurrency(effectiveLTV, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-text-header">
				<div className="col-span-2 text-md">{formatCurrency(effectiveInterest, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-text-header">
				<div className="col-span-2 text-md">{formatCurrency(available, 2, 2)} ZCHF</div>
			</div>

			<div className="flex flex-col gap-2 text-text-header">
				<div className="col-span-2 text-md">{expirationString}</div>
			</div>
		</TableRow>
	);
}
