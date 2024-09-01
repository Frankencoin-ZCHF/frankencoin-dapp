import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { formatCurrency, FormatType, shortenAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import GovernancePositionsAction from "./GovernancePositionsAction";
import DisplayCollateralBorrowTable from "@components/PageBorrow/DisplayCollateralBorrowTable";
import { AddressLabelSimple } from "@components/AddressLabel";
import Link from "next/link";

interface Props {
	position: PositionQuery;
	prices: PriceQueryObjectArray;
}

export default function GovernancePositionsRow({ position, prices }: Props) {
	const price = prices[position.collateral.toLowerCase() as Address];
	if (!position || !price) return null;

	const limit = formatUnits(BigInt(position.limitForClones), 18);
	const maturity = (position.expiration - position.start) / 60 / 60 / 24 / 30;
	const denyUntil = (position.start * 1000 - Date.now()) / 1000 / 60 / 60;

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernancePositionsAction key={position.position} position={position} />
				</div>
			}
		>
			<div className="flex flex-col">
				<DisplayCollateralBorrowTable
					symbol={position.collateralSymbol}
					name={position.collateralName}
					address={position.collateral}
				/>
			</div>

			<div className="flex flex-col">
				<Link href={`/monitoring/${position.position}`} className="underline cursor-pointer">
					{shortenAddress(position.position)}
				</Link>
				<AddressLabelSimple address={position.owner} showLink />
			</div>

			<div className="flex flex-col">
				<span className="">
					{formatCurrency(limit)} <span className="">ZCHF</span>
				</span>
				<div className="">{formatCurrency(position.reserveContribution / 10_000, 0, 0, 0)}%</div>
			</div>

			<div className="flex flex-col">
				<div className="">{formatCurrency(position.annualInterestPPM / 10_000)}%</div>
				<span className="">{formatCurrency(maturity, 1, 1, FormatType.us)} months</span>
			</div>

			<div className="flex flex-col">
				<span className={` ${denyUntil < 10 ? "text-red-500" : ""}`}>{Math.round(denyUntil)} hours</span>
				<span className="">{formatCurrency(position.challengePeriod / 60 / 60, 1, 1, FormatType.us)} hours</span>
			</div>
		</TableRow>
	);
}
