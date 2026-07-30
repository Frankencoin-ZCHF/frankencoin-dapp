import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";
import { formatCurrency, formatDateTime, normalizeAddress } from "@utils";
import { useRouter as useNavigation } from "next/navigation";
import AppButton from "@components/AppButton";
import StatRow from "./StatRow";
import { getForceSellAuctionEnd, getForceSellPrice } from "../../utils/forceSell";

interface Props {
	position: PositionQuery;
}

export default function ForceSellAuctionCard({ position }: Props) {
	const navigate = useNavigation();

	const priceDigits = 36 - position.collateralDecimals;
	const total = Number(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals));
	const currentPrice = getForceSellPrice(position);
	const priceFormatted = formatCurrency(formatUnits(currentPrice, priceDigits), 2, 2);

	const auctionEndMs = getForceSellAuctionEnd(position) * 1000;
	const isEnded = Date.now() >= auctionEndMs;

	return (
		<div className="rounded-lg bg-card-content-primary p-3 flex flex-col gap-2">
			<div className="text-sm font-semibold text-text-primary">Auction at Expiration</div>

			<StatRow label="Available">
				{formatCurrency(total, 2, 2)} {position.collateralSymbol}
			</StatRow>
			<StatRow label="Current Price">~{priceFormatted} ZCHF</StatRow>
			<StatRow label="Expired">{formatDateTime(position.expiration)}</StatRow>

			<AppButton
				className="h-9 mt-1"
				disabled={isEnded}
				onClick={() => navigate.push(`/monitoring/${normalizeAddress(position.position)}/forceSell`)}
			>
				{isEnded ? "Auction Ended" : "Bid"}
			</AppButton>
		</div>
	);
}
