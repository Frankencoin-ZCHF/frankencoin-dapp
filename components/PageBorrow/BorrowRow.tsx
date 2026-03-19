import TableRowSearchable from "../Table/TableRowSearchable";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency, FormatType, normalizeAddress } from "../../utils/format";
import { PositionQueryV2 } from "@frankencoin/api";
import DisplayCollateralBorrowTable from "./DisplayCollateralBorrowTable";
import AppBox from "@components/AppBox";
import { formatUnits } from "viem";
import { SwapVCHFStatsReturn } from "@hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";

interface Props {
	headers: string[];
	tab: string;
	position: PositionQueryV2;
	vchfBridge: SwapVCHFStatsReturn;
}

export default function BorrowRow({ headers, tab, position, vchfBridge }: Props) {
	const navigate = useNavigation();

	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[normalizeAddress(position.collateral)]?.price?.usd || 0;
	const zchfPrice = prices[normalizeAddress(position.zchf)]?.price?.usd || 0;
	if (!collTokenPrice || !zchfPrice) return null;

	const interest: number = position.annualInterestPPM / 10 ** 4;
	const reserve: number = position.reserveContribution / 10 ** 4;

	const price: number = parseInt(position.price) / 10 ** (36 - position.collateralDecimals);

	const expirationStr = new Date(position.expiration * 1000).toDateString().split(" ");
	const expirationString: string = `${expirationStr[2]} ${expirationStr[1]} ${expirationStr[3]}`;

	const effectiveLTV: number = ((price * (1 - reserve / 100)) / collTokenPrice) * zchfPrice * 100;
	const effectiveInterest: number = interest / (1 - reserve / 100);

	const isPending = position.start * 1000 > Date.now();

	const isVCHF = normalizeAddress(position.collateral) == normalizeAddress("0x79d4f0232A66c4c91b89c76362016A1707CFBF4f");

	const mintable = isVCHF
		? formatUnits(vchfBridge.bridgeLimit - vchfBridge.otherBridgeBal, 18)
		: formatUnits(BigInt(position.availableForClones), 18);

	return (
		<TableRowSearchable
			headers={headers}
			tab={tab}
			actionCol={
				<div
					className="flex items-center justify-end h-full cursor-pointer hover:text-button-hover"
					onClick={() => navigate.push(isVCHF ? "/swap" : `/mint/${position.position}`)}
				>
					<FontAwesomeIcon className="flex md:-mr-2" icon={faAngleRight} />
				</div>

				// <Button
				// 	className="h-10"
				// 	onClick={() => navigate.push(isVCHF ? "/swap" : `/mint/${position.position}`)}
				// 	disabled={isPending}
				// >
				// 	<
				// 	Borrow
				// </Button>
			}
		>
			<div className="flex flex-col max-md:mb-5">
				<AppBox className="md:hidden">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
						price={collTokenPrice}
					/>
				</AppBox>
				<div className="max-md:hidden">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
						price={collTokenPrice}
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
				<div className="col-span-2 text-md">{formatCurrency(mintable, 2, 2, FormatType.symbol)}</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className={`col-span-2 text-md ${isPending ? "font-bold" : ""}`}>
					{isPending ? "Available Soon" : expirationString}
				</div>
			</div>
		</TableRowSearchable>
	);
}
