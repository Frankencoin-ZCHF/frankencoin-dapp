import { ChallengesQueryItem, PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";
import { formatCurrency, formatDate, normalizeAddress } from "@utils";
import { useRouter as useNavigation } from "next/navigation";
import Button from "@components/Button";
import StatRow from "./StatRow";

interface Props {
	position: PositionQuery;
	challenge: ChallengesQueryItem;
}

export default function AuctionCard({ position, challenge }: Props) {
	const navigate = useNavigation();

	const priceDigit = 36 - position.collateralDecimals;
	const total = Number(formatUnits(challenge.size, position.collateralDecimals));
	const remaining = Number(formatUnits(challenge.size - challenge.filledSize, position.collateralDecimals));
	const fillPct = total > 0 ? ((total - remaining) / total) * 100 : 0;
	const liqPrice = formatCurrency(formatUnits(challenge.liqPrice, priceDigit), 2, 2);

	return (
		<div className="rounded-lg bg-card-content-primary p-3 flex flex-col gap-2">
			<div className="text-sm font-semibold text-text-primary">Auction #{String(challenge.number)}</div>

			<StatRow label="Remaining">
				{formatCurrency(remaining, 2, 2)} / {formatCurrency(total, 2, 2)} {position.collateralSymbol}
			</StatRow>
			<StatRow label="Liq. Price">{liqPrice} ZCHF</StatRow>
			<StatRow label="Started">{formatDate(Number(challenge.start))}</StatRow>

			<div className="h-1.5 rounded-full bg-table-header-secondary overflow-hidden">
				<div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${fillPct}%` }} />
			</div>
			<div className="text-xs text-text-secondary">{formatCurrency(fillPct, 1, 1)}% filled</div>

			<Button
				className="h-9 mt-1"
				onClick={() => navigate.push(`/monitoring/${normalizeAddress(challenge.position)}/auction/${challenge.number}`)}
			>
				Place Bid
			</Button>
		</div>
	);
}
