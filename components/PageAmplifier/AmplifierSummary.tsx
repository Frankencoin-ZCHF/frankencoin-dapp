import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { AmplifierPriceView, AmplifierStats, formatForexDeviation } from "../../hooks/useAmplifier";
import { FormatType, formatCurrency, formatDateTime } from "@utils";

interface Props {
	stats: AmplifierStats;
	priceView: AmplifierPriceView;
}

export default function AmplifierSummary({ stats, priceView }: Props) {
	const priceUnit = priceView.unit;
	const anchorPrice = priceView.anchor;

	return (
		<AppCard>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
				<AppBox>
					<DisplayLabel label="Current Price" />
					<DisplayAmount
						output={`${formatCurrency(priceView.current, 2, 4, FormatType.us) ?? "-"}${formatForexDeviation(priceView)}`}
						unit={priceUnit}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Forex Rate" />
					<DisplayAmount
						output={priceView.forex > 0 ? formatCurrency(priceView.forex, 2, 4, FormatType.us) ?? "-" : "-"}
						unit={priceView.inverted ? "USD/CHF" : "CHF/USD"}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Anchor Price" />
					<DisplayAmount output={formatCurrency(anchorPrice, 2, 4, FormatType.us) ?? "-"} unit={priceUnit} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Expiration" />
					<DisplayAmount output={stats.expiration > 0n ? formatDateTime(stats.expiration) : "-"} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Borrowed" />
					<DisplayAmount amount={stats.totalBorrowed} digits={18} currency={stats.zchfSymbol} address={stats.zchf} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Borrowing Limit" />
					<DisplayAmount amount={stats.limit} digits={18} currency={stats.zchfSymbol} address={stats.zchf} />
				</AppBox>
			</div>
		</AppCard>
	);
}
