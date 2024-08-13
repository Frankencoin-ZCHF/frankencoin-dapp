import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { BidsQueryItem, ChallengesId } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "../../utils/format";
import Link from "next/link";
import { useContractUrl } from "@hooks";

interface Props {
	bid: BidsQueryItem;
}

export default function MyPositionsBidsRow({ bid }: Props) {
	const positions = useSelector((state: RootState) => state.positions.mapping);
	const challenges = useSelector((state: RootState) => state.challenges.mapping);

	const pid = bid.position.toLowerCase() as Address;
	const cid = `${pid}-challenge-${bid.number}` as ChallengesId;

	const position = positions.map[pid];
	const challenge = challenges.map[cid];
	const url = useContractUrl(position.collateral || zeroAddress);
	if (!position || !challenge) return null;

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			actionCol={
				<div className="">
					<Link
						href={`/challenges/${bid.number}/bid`}
						className={`btn btn-primary w-full h-10 ${challenge.status === "Active" ? "" : "hidden"}`}
					>
						Buy Again
					</Link>
				</div>
			}
		>
			{/* Collateral */}
			<div className="-ml-12 flex items-center">
				<div onClick={openExplorer}>
					<div className="mr-4">
						<TokenLogo currency={position.collateralSymbol} />
					</div>
				</div>
				<div className={`col-span-2 text-md`}>{`${formatCurrency(formatUnits(bid.filledSize, position.collateralDecimals), 2, 2)} ${
					position.collateralSymbol
				}`}</div>
			</div>

			{/* Price */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">
					{formatCurrency(formatUnits(bid.price, 36 - position.collateralDecimals), 2, 2)} ZCHF
				</div>
			</div>

			{/* Bid */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">{`${formatCurrency(formatUnits(bid.bid, 18), 2, 2)} ZCHF`}</div>
			</div>

			{/* State */}
			<div className="flex flex-col">
				<div className="text-md text-text-header">{bid.bidType}</div>
				{bid.bidType === "Averted" ? null : (
					<div className="text-sm text-text-header">
						{formatCurrency(formatUnits(bid.acquiredCollateral, position.collateralDecimals))} {position.collateralSymbol}
					</div>
				)}
			</div>
		</TableRow>
	);
}
