import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import ChallengesRow from "./ChallengesRow";

export default function ChallengesTable() {
	const { list } = useSelector((state: RootState) => state.challenges);
	const matchingChallenges = list.list.filter((c) => {
		const DIFFINMS: number = 1000 * 60 * 60 * 24 * 10; // show e.g. last 10days
		const matching: boolean = Date.now() - parseInt(c.start.toString()) * 1000 < DIFFINMS;
		return c.status == "Active" || matching;
	});

	return (
		<Table>
			<TableHeader headers={["Collateral", "Challenge", "Active Auction", "Averted (avg.)", "Succeeded (avg.)", "Maturity"]} />
			<TableBody>
				{matchingChallenges.length == 0 ? (
					<TableRowEmpty>{"There are no challenges yet."}</TableRowEmpty>
				) : (
					matchingChallenges.map((c) => <ChallengesRow key={c.id} challenge={c} />)
				)}
			</TableBody>
		</Table>
	);
}
