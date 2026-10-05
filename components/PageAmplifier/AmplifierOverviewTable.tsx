import Table from "@components/Table";
import TableBody from "@components/Table/TableBody";
import TableHeader from "@components/Table/TableHead";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import AmplifierOverviewRow from "./AmplifierOverviewRow";
import { useAmplifierOverviews } from "../../hooks/useAmplifier";
import { KNOWN_AMPLIFIERS } from "../../utils/amplifierConstants";
import { isDateExpired } from "@utils";

export default function AmplifierOverviewTable() {
	const headers = ["Pool", "Chain", "Expiration", "Borrowed", "Limit"];
	const overviews = useAmplifierOverviews(KNOWN_AMPLIFIERS);

	// expired amplifiers with nothing borrowed are history and not worth a row
	const rows = KNOWN_AMPLIFIERS.map((amplifier, i) => ({ amplifier, overview: overviews[i] })).filter(({ overview }) => {
		if (overview.isLoading || overview.invalid) return true;
		const expired = overview.expiration > 0n && isDateExpired(overview.expiration);
		return !(expired && overview.totalBorrowed === 0n);
	});

	return (
		<Table>
			<TableHeader headers={headers} actionCol />
			<TableBody>
				{rows.length == 0 ? (
					<TableRowEmpty>There are no active amplifiers.</TableRowEmpty>
				) : (
					rows.map(({ amplifier, overview }) => (
						<AmplifierOverviewRow
							key={`${amplifier.chainId}-${amplifier.address}`}
							headers={headers}
							amplifier={amplifier}
							overview={overview}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}
