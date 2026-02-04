import { Address, formatUnits, zeroAddress } from "viem";
import { BidsQueryItem, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, formatDate } from "../../utils/format";
import { useContractUrl } from "@hooks";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { shortenAddress, TxUrl } from "@utils";
import { TxLabelSimple } from "@components/AddressLabel";

interface Props {
	challenge: ChallengesQueryItem;
	bids: BidsQueryItem[];
}

export default function MonitoringAllChallengesRow({ challenge, bids }: Props) {
	const navigate = useNavigation();

	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const position = positions.map[challenge.position.toLowerCase() as Address];
	const url = useContractUrl(position?.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const challengeSize: number = parseInt(challenge.size.toString()) / 10 ** position.collateralDecimals;
	const startDate: string = formatDate(challenge.start);
	const isActive = challenge.status === "Active";

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className="bg-table-row-primary border border-table-row-hover rounded-xl overflow-hidden">
			{/* Challenge header */}
			<div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-4">
				{/* Collateral */}
				<div className="flex flex-row items-center gap-3 md:w-[200px] flex-shrink-0">
					<span className="cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className="text-md text-text-primary font-semibold">
						{formatCurrency(challengeSize, 2, 2)} {position.collateralSymbol}
					</span>
				</div>

				{/* Status */}
				<div className="flex flex-row items-center gap-2 md:w-[120px]">
					<span className="max-md:text-text-subheader max-md:text-sm">Status:</span>
					<span
						className={`text-sm font-semibold px-2 py-0.5 rounded bg-slate-300 ${
							isActive ? "text-green-500" : "text-blue-500"
						}`}
					>
						{isActive ? "Active" : "Ended"}
					</span>
				</div>

				{/* Bids count */}
				<div className="flex flex-row items-center gap-2 md:w-[80px]">
					<span className="max-md:text-text-subheader max-md:text-sm">Bids:</span>
					<span className="text-md">{bids.length}</span>
				</div>

				{/* Date */}
				<div className="flex flex-row items-center gap-2 md:flex-1">
					<span className="max-md:text-text-subheader max-md:text-sm">Date:</span>
					<span className="text-md">{startDate}</span>
				</div>

				{/* Action */}
				<div className="flex-shrink-0 md:w-[8rem]">
					{isActive ? (
						<Button
							className="h-10"
							onClick={() => navigate.push(`/monitoring/${challenge.position}/auction/${challenge.number}`)}
						>
							Bid
						</Button>
					) : (
						<Button className="h-10">
							<TxLabelSimple label="View Tx" tx={challenge.txHash} showLink />
						</Button>
					)}
				</div>
			</div>

			{/* Nested bids */}
			{bids.length > 0 && (
				<div className="border-t border-table-row-hover">
					{/* Bids header - desktop only */}
					<div className="max-md:hidden px-8 py-2 grid grid-cols-5 gap-2 text-sm text-text-subheader bg-card-body-primary/50">
						<div className="pl-6">Bidder</div>
						<div>Filled Size</div>
						<div>Price</div>
						<div>Bid Amount</div>
						<div>Type</div>
					</div>

					{bids.map((bid) => (
						<BidRow key={bid.id} bid={bid} position={position} />
					))}
				</div>
			)}

			{bids.length === 0 && (
				<div className="border-t border-table-row-hover px-8 py-3 text-sm text-text-subheader pl-10">No bids</div>
			)}
		</div>
	);
}

function BidRow({ bid, position }: { bid: BidsQueryItem; position: any }) {
	const filledSize = formatCurrency(formatUnits(bid.filledSize, position.collateralDecimals));
	const price = formatCurrency(formatUnits(bid.price, 36 - position.collateralDecimals), 2, 2);
	const bidAmount = formatCurrency(formatUnits(bid.bid, 18), 2, 2);

	return (
		<div className="px-4 md:px-8 py-2 md:hover:bg-table-row-hover duration-300 border-t border-table-row-hover/50">
			{/* Desktop */}
			<div className="max-md:hidden grid grid-cols-5 gap-2 text-sm">
				<div className="pl-6 text-text-subheader">{shortenAddress(bid.bidder)}</div>
				<div>
					{filledSize} {position.collateralSymbol}
				</div>
				<div>{price} ZCHF</div>
				<div>{bidAmount} ZCHF</div>
				<div>
					<span
						className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-300 ${
							bid.bidType === "Averted" ? "text-yellow-500" : "text-green-500"
						}`}
					>
						{bid.bidType}
					</span>
				</div>
			</div>

			{/* Mobile */}
			<div className="md:hidden flex flex-col gap-1 text-sm">
				<div className="flex justify-between">
					<span className="text-text-subheader">Bidder</span>
					<span>{shortenAddress(bid.bidder)}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-subheader">Filled Size</span>
					<span>
						{filledSize} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-subheader">Price</span>
					<span>{price} ZCHF</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-subheader">Bid Amount</span>
					<span>{bidAmount} ZCHF</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-subheader">Type</span>
					<span
						className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-300 ${
							bid.bidType === "Averted" ? "text-yellow-500" : "text-green-500"
						}`}
					>
						{bid.bidType}
					</span>
				</div>
			</div>
		</div>
	);
}
