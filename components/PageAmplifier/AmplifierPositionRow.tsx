import AppLink from "@components/AppLink";
import AppMenu from "@components/AppMenu";
import DisplayAmount from "@components/DisplayAmount";
import TableRow from "@components/Table/TableRow";
import { useContractUrl } from "@hooks";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import { FormatType, formatCurrency, shortenAddress } from "@utils";
import { getAmountsForLiquidity, getSqrtRatioAtTick } from "../../utils/uniswapV3Math";

export type AmplifierPositionAction = "add" | "remove" | "collect";

interface Props {
	headers: string[];
	stats: AmplifierStats;
	position: AmplifiedPositionInfo;
	onAction: (action: AmplifierPositionAction, position: AmplifiedPositionInfo) => void;
}

export default function AmplifierPositionRow({ headers, stats, position, onAction }: Props) {
	const url = useContractUrl(position.address);

	const sqrtA = getSqrtRatioAtTick(position.tickLow);
	const sqrtB = getSqrtRatioAtTick(position.tickHigh);
	const amounts =
		stats.sqrtPriceX96 > 0n
			? getAmountsForLiquidity(stats.sqrtPriceX96, sqrtA, sqrtB, position.liquidity, false)
			: { amount0: 0n, amount1: 0n };
	const usdAmount = stats.zchfIsToken0 ? amounts.amount1 : amounts.amount0;
	const zchfAmount = stats.zchfIsToken0 ? amounts.amount0 : amounts.amount1;

	const priceAtLow = stats.zchfPerUsdAtTick(position.tickLow);
	const priceAtHigh = stats.zchfPerUsdAtTick(position.tickHigh);
	const rangeLow = Math.min(priceAtLow, priceAtHigh);
	const rangeHigh = Math.max(priceAtLow, priceAtHigh);
	const inRange = stats.currentTick >= position.tickLow && stats.currentTick < position.tickHigh;

	return (
		<TableRow
			headers={headers}
			tab={headers[0]}
			actionCol={
				<div className="text-right max-md:text-center">
					<AppMenu
						items={[
							{ label: "Add Liquidity", onClick: () => onAction("add", position) },
							{ label: "Remove Liquidity", onClick: () => onAction("remove", position) },
							{ label: "Collect Fees", onClick: () => onAction("collect", position) },
						]}
					/>
				</div>
			}
		>
			<div className="flex flex-col max-md:text-left">
				<AppLink className="justify-start" label={shortenAddress(position.address)} href={url} external={true} />
			</div>
			<div className="flex flex-col">
				{formatCurrency(rangeLow, 2, 4, FormatType.us)} - {formatCurrency(rangeHigh, 2, 4, FormatType.us)}
				<span className={`text-sm ${inRange ? "text-text-success" : "text-text-warning"}`}>
					{inRange ? "in range" : "out of range"}
				</span>
			</div>
			<div className="flex flex-col">
				<DisplayAmount className="" amount={usdAmount} digits={stats.usdDecimals} unit={stats.usdSymbol} />
			</div>
			<div className="flex flex-col">
				<DisplayAmount className="" amount={zchfAmount} digits={18} unit={stats.zchfSymbol} />
			</div>
			<div className="flex flex-col">
				<DisplayAmount className="" amount={position.borrowed} digits={18} unit={stats.zchfSymbol} />
			</div>
		</TableRow>
	);
}
