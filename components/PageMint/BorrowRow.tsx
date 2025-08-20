import { Address } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency } from "../../utils/format";
import { PositionQuery } from "@deuro/api";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import Button from "@components/Button";
import AppBox from "@components/AppBox";
import { TOKEN_SYMBOL } from "@utils";
import { useTranslation } from "next-i18next";

interface Props {
	headers: string[];
	position: PositionQuery;
	tab: string;
}

export default function BorrowRow({ headers, position, tab }: Props) {
	const navigate = useNavigation();
	const { t } = useTranslation();

	const prices = useSelector((state: RootState) => state.prices.coingecko || {});
	const eurPrice = useSelector((state: RootState) => state.prices.eur?.usd);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const deuroPrice = eurPrice || prices[position.deuro.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !deuroPrice) return null;

	const interest: number = Math.round((position.annualInterestPPM / 10 ** 4) * 100) / 100;
	const reserve: number = Math.round((position.reserveContribution / 10 ** 4) * 100) / 100;

	const available: number = Math.round((parseInt(position.availableForClones) / 10 ** position.deuroDecimals) * 100) / 100;
	const price: number = Math.round((parseInt(position.price) / 10 ** (36 - position.collateralDecimals)) * 100) / 100;
	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]}`;

	// effectiveLTV = liquidation price * (1 - reserve) / market price
	const effectiveLTV: number = Math.round(((price * (1 - reserve / 100)) / collTokenPrice) * deuroPrice * 10000) / 100;
	const effectiveInterest: number = Math.round((interest / (1 - reserve / 100)) * 100) / 100;

	return (
		<TableRow
			headers={headers}
			actionCol={
				<Button className="h-10" onClick={() => navigate.push(`/mint/${position.position}`)}>
					{t('mint.mint')}
				</Button>
			}
			tab={tab}
			showFirstHeader={true}
		>
			<div className="flex flex-col max-md:mb-5">
				<div>
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2 text-base sm:font-medium leading-tight">
				<div className="col-span-2 text-md">{formatCurrency(effectiveLTV, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-base sm:font-medium leading-tight">
				<div className="col-span-2 text-md">{formatCurrency(effectiveInterest, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2 text-base sm:font-medium leading-tight">
				<div className="col-span-2 text-md">
					{formatCurrency(available, 2, 2)} {TOKEN_SYMBOL}
				</div>
			</div>

			<div className="flex flex-col gap-2 text-base sm:font-medium leading-tight">
				<div className="col-span-2 text-md">{expirationString}</div>
			</div>
		</TableRow>
	);
}
