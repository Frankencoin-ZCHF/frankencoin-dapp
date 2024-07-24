import SupervisionRow from "./MypositionsRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";

export default function MypositionsTable() {
	const { list } = useSelector((state: RootState) => state.positions);
	const { address } = useAccount();
	const account = address || zeroAddress;

	const sortedByCollateral: { [key: Address]: PositionQuery[] } = {};
	const closedPositions: { [key: Address]: PositionQuery[] } = {};
	for (const p of list.list) {
		const k: Address = p.collateral.toLowerCase() as Address;

		if (p.owner !== account) continue;

		if (p.closed || p.denied) {
			if (closedPositions[k] == undefined) closedPositions[k] = [];
			closedPositions[k].push(p);
			continue;
		}

		if (sortedByCollateral[k] == undefined) sortedByCollateral[k] = [];
		sortedByCollateral[k].push(p);
	}

	const flatingPositions: PositionQuery[] = Object.values(sortedByCollateral).flat(1);
	const matchingPositions: PositionQuery[] = flatingPositions.concat(Object.values(closedPositions).flat(1));

	return (
		<Table>
			<TableHeader
				headers={["Collateral", "Liquidation Price", "Minted", "State"]}
				subHeaders={["Value", "Market Price", "Available", "Time Left"]}
				actionCol
			/>
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"You do not have any positions"}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <SupervisionRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
