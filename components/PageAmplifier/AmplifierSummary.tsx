import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { FormatType, formatCurrency, formatDateTime } from "@utils";

interface Props {
	stats: AmplifierStats;
}

export default function AmplifierSummary({ stats }: Props) {
	const priceUnit = `${stats.zchfSymbol || "ZCHF"}/${stats.usdSymbol || "USD"}`;

	const anchorPrice = stats.anchorPricePerUsd;
	const boundLow = stats.zchfPerUsdAtTick(stats.minimumTick);
	const boundHigh = stats.zchfPerUsdAtTick(stats.maximumTick);
	const rangeLow = Math.min(boundLow, boundHigh);
	const rangeHigh = Math.max(boundLow, boundHigh);

	return (
		<div className="flex flex-col gap-4">
			<AppCard>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<DisplayLabel label="Current Price">
						<DisplayAmount output={formatCurrency(stats.pricePerUsd, 2, 4, FormatType.us) ?? "-"} unit={priceUnit} />
					</DisplayLabel>
					<DisplayLabel label="Anchor Price">
						<DisplayAmount output={formatCurrency(anchorPrice, 2, 4, FormatType.us) ?? "-"} unit={priceUnit} />
					</DisplayLabel>
					<DisplayLabel label="Allowed Price Range">
						<DisplayAmount
							output={`${formatCurrency(rangeLow, 2, 4, FormatType.us)} - ${formatCurrency(rangeHigh, 2, 4, FormatType.us)}`}
							unit={priceUnit}
						/>
					</DisplayLabel>
				</div>
			</AppCard>

			<AppCard>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<DisplayLabel label="Borrowed">
						<DisplayAmount amount={stats.totalBorrowed} digits={18} currency={stats.zchfSymbol} address={stats.zchf} />
					</DisplayLabel>
					<DisplayLabel label="Borrowing Limit">
						<DisplayAmount amount={stats.limit} digits={18} currency={stats.zchfSymbol} address={stats.zchf} />
					</DisplayLabel>
					<DisplayLabel label="Expiration">
						<DisplayAmount output={stats.expiration > 0n ? formatDateTime(stats.expiration) : "-"} />
					</DisplayLabel>
				</div>
			</AppCard>
		</div>
	);
}
