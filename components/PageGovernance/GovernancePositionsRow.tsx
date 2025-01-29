import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, PriceQueryObjectArray } from "@deuro/api";
import { formatCurrency, FormatType, shortenAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import GovernancePositionsAction from "./GovernancePositionsAction";
import DisplayCollateralBorrowTable from "@components/PageBorrow/DisplayCollateralBorrowTable";
import { AddressLabelSimple } from "@components/AddressLabel";
import Link from "next/link";
import AppBox from "@components/AppBox";
import { TOKEN_SYMBOL } from "@utils";

interface Props {
	headers: string[];
	subHeaders: string[];
	position: PositionQuery;
	prices: PriceQueryObjectArray;
	tab: string;
}

export default function GovernancePositionsRow({ headers, subHeaders, position, prices, tab }: Props) {
	const price = prices[position.collateral.toLowerCase() as Address];
	if (!position || !price) return null;

	const limit = formatUnits(BigInt(position.limitForClones), 18);
	const maturity = (position.expiration - position.start) / 60 / 60 / 24 / 30;
	const denyUntil = (position.start * 1000 - Date.now()) / 1000 / 60 / 60;

	return (
		<TableRow
			headers={headers}
			subHeaders={subHeaders}
			actionCol={
				<div className="">
					<GovernancePositionsAction key={position.position} position={position} />
				</div>
			}
			tab={tab}
		>
			<div className="flex flex-col max-md:mb-5">
				{/* desktop view */}
				<div className="max-md:hidden flex flex-row items-center">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
					/>
				</div>

				{/* mobile view */}
				<AppBox className="md:hidden flex flex-row items-center">
					<DisplayCollateralBorrowTable
						symbol={position.collateralSymbol}
						symbolTiny={`v${position.version}`}
						name={position.collateralName}
						address={position.collateral}
					/>
				</AppBox>
			</div>

			<div className="flex flex-col">
				<Link href={`/monitoring/${position.position}`} className="underline cursor-pointer">
					{shortenAddress(position.position)}
				</Link>
				<AddressLabelSimple className={"text-sm text-text-subheader"} address={position.owner} showLink />
			</div>

			<div className="flex flex-col">
				<span className="">
					{formatCurrency(limit)} <span className="">{TOKEN_SYMBOL}</span>
				</span>
				<div className="text-sm text-text-subheader">{formatCurrency(position.reserveContribution / 10_000, 0, 0, 0)}%</div>
			</div>

			<div className="flex flex-col">
				<div className="">{formatCurrency(position.annualInterestPPM / 10_000)}%</div>
				<span className="text-sm text-text-subheader">{formatCurrency(maturity, 1, 1, FormatType.us)} months</span>
			</div>

			<div className="flex flex-col">
				<span className={` ${denyUntil < 10 ? "text-red-500" : ""}`}>{Math.round(denyUntil)} hours</span>
				<span className="text-sm text-text-subheader">
					{formatCurrency(position.challengePeriod / 60 / 60, 1, 1, FormatType.us)} hours
				</span>
			</div>
		</TableRow>
	);
}
