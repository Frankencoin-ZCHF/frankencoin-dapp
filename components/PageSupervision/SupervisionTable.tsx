import SupervisionRow from "./SupervisionRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "../../redux/slices/positions.types";

export default function SupervisionTable() {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const openPositions: PositionQuery[] = [];

	for (const collateral in openPositionsByCollateral) {
		openPositions.push(...openPositionsByCollateral[collateral]);
	}

	const matchingPositions: PositionQuery[] = openPositions.filter((position) => !position.closed && !position.denied);

	return (
		<Table>
			<TableHeader headers={["Collateral", "Interest", "Reserve", "Limit", "Price", "Timing"]} />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <SupervisionRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
