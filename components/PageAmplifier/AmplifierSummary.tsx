import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { AmplifierPriceView, AmplifierStats } from "../../hooks/useAmplifier";
import { ForexRate } from "../../hooks/useForexRate";
import { FormatType, formatCurrency, formatDateTime } from "@utils";

interface Props {
	stats: AmplifierStats;
	priceView: AmplifierPriceView;
	forex: ForexRate;
}

export default function AmplifierSummary({ stats, priceView, forex }: Props) {
	const priceUnit = priceView.unit;
	const zchf = stats.zchfSymbol || "ZCHF";

	// how far the pool values ZCHF from its CHF forex value, independent of the displayed orientation
	const deviation = forex.usdPerChf > 0 && stats.usdPerZchf > 0 ? (stats.usdPerZchf / forex.usdPerChf - 1) * 100 : undefined;
	const deviationText =
		deviation === undefined
			? forex.isLoading
				? "Loading..."
				: "Forex rate unavailable"
			: Math.abs(deviation) < 0.005
			? `${zchf} trades at its CHF forex value`
			: `${zchf} trades ${Math.abs(deviation).toFixed(2)}% ${deviation > 0 ? "above" : "below"} its CHF forex value`;

	const anchorPrice = priceView.anchor;
	const boundLow = priceView.atTick(stats.minimumTick);
	const boundHigh = priceView.atTick(stats.maximumTick);
	const rangeLow = Math.min(boundLow, boundHigh);
	const rangeHigh = Math.max(boundLow, boundHigh);

	return (
		<div className="flex flex-col gap-4">
			<AppCard>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<DisplayLabel label="Current Price">
						<DisplayAmount output={formatCurrency(priceView.current, 2, 4, FormatType.us) ?? "-"} unit={priceUnit} />
					</DisplayLabel>
					<DisplayLabel label="Forex Rate">
						<DisplayAmount
							output={priceView.forex > 0 ? formatCurrency(priceView.forex, 2, 4, FormatType.us) ?? "-" : "-"}
							unit={priceView.inverted ? "USD/CHF" : "CHF/USD"}
						/>
						<div className="text-sm text-text-secondary">{deviationText}</div>
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
