import { Address } from "viem";
import Table from "@components/Table";
import TableBody from "@components/Table/TableBody";
import TableHeader from "@components/Table/TableHead";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import { useConnection } from "wagmi";
import { AmplifierPriceView, AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import AmplifierPositionRow, { AmplifierPositionAction } from "./AmplifierPositionRow";

interface Props {
	stats: AmplifierStats;
	priceView: AmplifierPriceView;
	positions: AmplifiedPositionInfo[];
	isLoading: boolean;
	apiError: string;
	overwrite?: Address;
	onAction: (action: AmplifierPositionAction, position: AmplifiedPositionInfo) => void;
}

export default function AmplifierPositionsTable({ stats, priceView, positions, isLoading, apiError, overwrite, onAction }: Props) {
	const { address: connected } = useConnection();
	const account = overwrite ?? connected;
	const headers = ["Position", "Price Range", `${stats.usdSymbol || "USD"} Part`, `${stats.zchfSymbol} Part`, "Borrowed"];

	// empty positions outside the current price are dead weight: they hold nothing, earn
	// nothing and cannot be amplified where they are, so they are not listed
	const visible = positions.filter((position) => {
		const empty = position.liquidity === 0n && position.borrowed === 0n;
		const inRange = stats.currentTick >= position.tickLow && stats.currentTick < position.tickHigh;
		return !empty || inRange;
	});

	return (
		<Table>
			<TableHeader headers={headers} actionCol />
			<TableBody>
				{visible.length == 0 ? (
					<TableRowEmpty>
						{apiError
							? apiError
							: isLoading
							? "Loading amplified positions..."
							: positions.length > 0
							? "This amplifier has no active positions."
							: "This amplifier has no positions yet."}
					</TableRowEmpty>
				) : (
					visible.map((position) => (
						<AmplifierPositionRow
							key={position.address}
							headers={headers}
							stats={stats}
							priceView={priceView}
							position={position}
							account={account}
							onAction={onAction}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}
