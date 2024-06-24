import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "../../redux/slices/positions.types";
import MypositionsRow from "./MypositionsRow";
import { useAccount } from "wagmi";

export default function MypositionsTable() {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { address } = useAccount();
	const openPositions: PositionQuery[] = [];

	for (const collateral in openPositionsByCollateral) {
		openPositions.push(...openPositionsByCollateral[collateral]);
	}

	const matchingPositions: PositionQuery[] = address ? openPositions.filter((position) => position.owner === address) : [];

	return (
		<Table>
			<TableHeader headers={["Collateral", "Balance", "Liquidation", "Challenges", "Maturity"]} />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"You don't have any positions."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <MypositionsRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
