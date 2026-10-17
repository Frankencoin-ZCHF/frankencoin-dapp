import { useRouter as useNavigation } from "next/navigation";
import TableRowSearchable from "../Table/TableRowSearchable";
import AppBox from "@components/AppBox";
import AppButton from "@components/AppButton";
import DisplayCollateralBorrowTable from "../PageBorrow/DisplayCollateralBorrowTable";
import { LeverageCollateral } from "@hooks";
import { formatCurrency, FormatType } from "@utils";

interface Props {
	headers: string[];
	tab: string;
	item: LeverageCollateral;
}

export default function LeverageRow({ headers, tab, item }: Props) {
	const navigate = useNavigation();
	const { collateral, position } = item;

	const interest: number = position.annualInterestPPM / 10 ** 4;
	const reserve: number = position.reserveContribution / 10 ** 4;
	const effectiveInterest: number = interest / (1 - reserve / 100);

	return (
		<TableRowSearchable
			headers={headers}
			tab={tab}
			actionCol={
				<AppButton className="h-10" onClick={() => navigate.push(`/leverage/${position.position}`)}>
					Leverage
				</AppButton>
			}
		>
			<div className="flex flex-col max-md:mb-5">
				<AppBox className="md:hidden">
					<DisplayCollateralBorrowTable
						symbol={collateral.symbol}
						name={collateral.name}
						address={collateral.address}
						price={item.priceUsd}
						hideMyWallet={true}
					/>
				</AppBox>
				<div className="max-md:hidden">
					<DisplayCollateralBorrowTable
						symbol={collateral.symbol}
						name={collateral.name}
						address={collateral.address}
						price={item.priceUsd}
						hideMyWallet={true}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md font-bold text-purple-400">{`${formatCurrency(item.maxLeverage, 2, 2)}×`}</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{`${formatCurrency(effectiveInterest, 2, 2)}%`}</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{`${formatCurrency(item.flashloanLiquidityChf, 0, 2, FormatType.symbol)} CHF`}</div>
			</div>
		</TableRowSearchable>
	);
}
