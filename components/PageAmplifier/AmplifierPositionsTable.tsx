import { Address } from "viem";
import Table from "@components/Table";
import TableBody from "@components/Table/TableBody";
import TableHeader from "@components/Table/TableHead";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import { useConnection } from "wagmi";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo } from "../../hooks/useAmplifiedPositions";
import AmplifierPositionRow, { AmplifierPositionAction } from "./AmplifierPositionRow";

interface Props {
	stats: AmplifierStats;
	positions: AmplifiedPositionInfo[];
	isLoading: boolean;
	apiError: string;
	overwrite?: Address;
	onAction: (action: AmplifierPositionAction, position: AmplifiedPositionInfo) => void;
}

export default function AmplifierPositionsTable({ stats, positions, isLoading, apiError, overwrite, onAction }: Props) {
	const { address: connected } = useConnection();
	const account = overwrite ?? connected;
	const headers = ["Position", "Price Range", `${stats.usdSymbol || "USD"} Part`, `${stats.zchfSymbol} Part`, "Borrowed"];

	return (
		<Table>
			<TableHeader headers={headers} actionCol />
			<TableBody>
				{positions.length == 0 ? (
					<TableRowEmpty>
						{apiError ? apiError : isLoading ? "Loading amplified positions..." : "This amplifier has no positions yet."}
					</TableRowEmpty>
				) : (
					positions.map((position) => (
						<AmplifierPositionRow
							key={position.address}
							headers={headers}
							stats={stats}
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
