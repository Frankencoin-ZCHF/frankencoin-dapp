import PositionRow from "./BorrowRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "../../redux/slices/positions.types";

export default function BorrowTable() {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const openPositions: PositionQuery[] = [];

	for (const collateral in openPositionsByCollateral) {
		openPositions.push(...openPositionsByCollateral[collateral]);
	}

	const matchingPositions: PositionQuery[] = openPositions.filter((position) => parseInt(position.availableForClones) > 0n);

	return (
		<Table>
			<TableHeader headers={["Collateral", "Effective LTV", "Effective Interest", "Price", "Available", "Maturity"]} />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <PositionRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
