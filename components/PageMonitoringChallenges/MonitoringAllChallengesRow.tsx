import { Address, formatUnits, zeroAddress } from "viem";
import { BidsQueryItem, ChallengesQueryItem } from "@frankencoin/api";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, formatDate, normalizeAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import { shortenAddress } from "@utils";
import { TxLabelSimple } from "@components/AddressLabel";

interface Props {
	challenge: ChallengesQueryItem;
	bids: BidsQueryItem[];
}

export default function MonitoringAllChallengesRow({ challenge, bids }: Props) {
	const navigate = useNavigation();

	const positions = useSelector((state: RootState) => state.positions.mapping);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const position = positions.map[normalizeAddress(challenge.position)];
	const url = useContractUrl(position?.collateral || zeroAddress);
	if (!position) return null;

	const collTokenPrice = prices[normalizeAddress(position.collateral)]?.price?.usd;
	const zchfPrice = prices[normalizeAddress(position.zchf)]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const challengeSize: number = parseInt(challenge.size.toString()) / 10 ** position.collateralDecimals;
	const startDate: string = formatDate(challenge.start);
	const isActive = challenge.status === "Active";

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<div className="bg-table-row-primary border border-table-row-hover rounded-lg overflow-hidden">
			{/* Challenge header */}
			<div className="px-4 md:px-8 py-4 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-center">
				{/* Collateral */}
				<div className="col-span-2 md:col-span-1 flex flex-row items-center gap-3">
					<span className="cursor-pointer" onClick={openExplorer}>
						<TokenLogo currency={position.collateralSymbol} />
					</span>
					<span className="text-md text-text-primary font-semibold">
						{formatCurrency(challengeSize, 2, 2)} {position.collateralSymbol}
					</span>
				</div>

				{/* Status */}
				<div className="flex flex-row items-center gap-2">
					<span className="text-sm text-text-secondary">Status:</span>
					<span
						className={`text-sm font-semibold px-2 py-0.5 rounded bg-menu-active ${
							isActive ? "text-green-500" : "text-yellow-500"
						}`}
					>
						{isActive ? "Active" : "Ended"}
					</span>
				</div>

				{/* Bids count */}
				<div className="flex flex-row items-center gap-2">
					<span className="text-sm text-text-secondary">Bids:</span>
					<span className="text-md">{bids.length}</span>
				</div>

				{/* Date */}
				<div className="flex flex-row items-center gap-2">
					<span className="text-sm text-text-secondary">Date:</span>
					<span className="text-md">{startDate}</span>
				</div>

				{/* Action */}
				<div className="flex items-center justify-end md:justify-start">
					{isActive ? (
						<Button
							className="h-8"
							onClick={() => navigate.push(`/monitoring/${challenge.position}/auction/${challenge.number}`)}
						>
							Bid
						</Button>
					) : (
						<span className="underline text-sm">
							<TxLabelSimple label="View Tx" tx={challenge.txHash} showLink />
						</span>
					)}
				</div>
			</div>

			{/* Nested bids */}
			{bids.length > 0 && (
				<div className="border-t border-table-row-hover">
					{/* Bids header - desktop only */}
					<div className="max-md:hidden px-8 py-2 grid grid-cols-6 gap-2 text-sm text-text-secondary bg-card-body-primary/50">
						<div>Type</div>
						<div>Bidder</div>
						<div>Filled Size</div>
						<div>Price</div>
						<div>Bid Amount</div>
						<div>Tx</div>
					</div>

					{bids.map((bid) => (
						<BidRow key={bid.id} bid={bid} position={position} />
					))}
				</div>
			)}

			{bids.length === 0 && (
				<div className="border-t border-table-row-hover px-8 py-3 text-sm text-text-secondary pl-10">No bids</div>
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
			<div className="max-md:hidden grid grid-cols-6 gap-2 text-sm">
				<div>
					<span
						className={`text-xs font-semibold px-2 py-0.5 rounded bg-menu-active ${
							bid.bidType === "Averted" ? "text-yellow-500" : "text-green-500"
						}`}
					>
						{bid.bidType}
					</span>
				</div>
				<div className="text-text-secondary">{shortenAddress(bid.bidder)}</div>
				<div>
					{filledSize} {position.collateralSymbol}
				</div>
				<div>{price} ZCHF</div>
				<div>{bidAmount} ZCHF</div>
				<div className="underline">
					<TxLabelSimple label="View" tx={bid.txHash} showLink />
				</div>
			</div>

			{/* Mobile */}
			<div className="md:hidden flex flex-col gap-1 text-sm">
				<div className="flex justify-between">
					<span className="text-text-subheader">Type</span>
					<span
						className={`text-xs font-semibold px-2 py-0.5 rounded bg-menu-active ${
							bid.bidType === "Averted" ? "text-yellow-500" : "text-green-500"
						}`}
					>
						{bid.bidType}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-secondary">Bidder</span>
					<span>{shortenAddress(bid.bidder)}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-secondary">Filled Size</span>
					<span>
						{filledSize} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-secondary">Price</span>
					<span>{price} ZCHF</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-secondary">Bid Amount</span>
					<span>{bidAmount} ZCHF</span>
				</div>
				<div className="flex justify-between">
					<span className="text-text-secondary">Tx</span>
					<span className="underline">
						<TxLabelSimple label="View" tx={bid.txHash} showLink />
					</span>
				</div>
			</div>
		</div>
	);
}
