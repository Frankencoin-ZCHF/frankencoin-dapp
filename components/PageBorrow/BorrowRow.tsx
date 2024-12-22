import { Address, formatUnits, parseUnits } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency } from "../../utils/format";
import { PositionQueryV2 } from "@frankencoin/api";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import Button from "@components/Button";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQueryV2;
}

export default function BorrowRow({ headers, tab, position }: Props) {
	const navigate = useNavigation();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = position.annualInterestPPM / 10 ** 4;
	const reserve: number = position.reserveContribution / 10 ** 4;

	const price: number = parseInt(position.price) / 10 ** (36 - position.collateralDecimals);

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]}`;

	const effectiveLTV: number = ((price * (1 - reserve / 100)) / collTokenPrice) * zchfPrice * 100;
	const effectiveInterest: number = interest / (1 - reserve / 100);

	return (
		<TableRow
			headers={headers}
			tab={tab}
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

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(effectiveLTV, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(effectiveInterest, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(price, 2, 2)} ZCHF</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{expirationString}</div>
			</div>
		</TableRow>
	);
}
