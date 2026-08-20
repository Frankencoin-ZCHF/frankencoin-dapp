import Table from "@components/Table";
import TableBody from "@components/Table/TableBody";
import TableHeader from "@components/Table/TableHead";
import AmplifierOverviewRow from "./AmplifierOverviewRow";
import { KNOWN_AMPLIFIERS } from "../../utils/amplifierConstants";

export default function AmplifierOverviewTable() {
	const headers = ["Pool", "Chain", "Expiration", "Borrowed", "Limit"];

	return (
		<Table>
			<TableHeader headers={headers} actionCol />
			<TableBody>
				{KNOWN_AMPLIFIERS.map((amplifier) => (
					<AmplifierOverviewRow key={`${amplifier.chainId}-${amplifier.address}`} headers={headers} amplifier={amplifier} />
				))}
			</TableBody>
		</Table>
	);
}
