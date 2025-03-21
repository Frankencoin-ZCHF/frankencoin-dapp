import TableRow from "../Table/TableRow";
import { formatCurrency } from "../../utils/format";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import Button from "@components/Button";
import AppBox from "@components/AppBox";
import { Market } from "../../redux/slices/morpho.types";
import { MorphoMarketUrl } from "@utils";
import { formatUnits } from "viem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

interface Props {
	headers: string[];
	tab: string;
	market: Market;
}

export default function BorrowMorphoRow({ headers, tab, market }: Props) {
	const link = MorphoMarketUrl(market.uniqueKey);
	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	const oraclePrice = Number(formatUnits(BigInt(market.state.price), 36 - market.collateralAsset.decimals + 18));
	const liquidationPrice = oraclePrice * Number(formatUnits(BigInt(market.lltv), 18));

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={
				<Button className="h-10" onClick={openExplorer}>
					<div>Borrow</div>
					<div className="">
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 my-auto cursor-pointer" />
					</div>
				</Button>
			}
		>
			<div className="flex flex-col max-md:mb-5">
				<AppBox className="md:hidden">
					<DisplayCollateralBorrowTable
						symbol={market.collateralAsset.symbol}
						name={market.collateralAsset.name}
						address={market.collateralAsset.address}
					/>
				</AppBox>
				<div className="max-md:hidden">
					<DisplayCollateralBorrowTable
						symbol={market.collateralAsset.symbol}
						name={market.collateralAsset.name}
						address={market.collateralAsset.address}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(formatUnits(BigInt(market.lltv) * 100n, 18), 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(market.state.borrowApy * 100, 2, 2)}%</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(liquidationPrice, 2, 2)} ZCHF</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="col-span-2 text-md">{formatCurrency(formatUnits(BigInt(market.state.liquidityAssets), 18), 2, 2)} ZCHF</div>
			</div>
		</TableRow>
	);
}
