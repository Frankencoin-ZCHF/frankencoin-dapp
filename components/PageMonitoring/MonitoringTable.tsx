import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import MonitoringRow from "./MonitoringRow";

export default function MonitoringTable() {
	const { list } = useSelector((state: RootState) => state.positions);

	const sortedByCollateral: { [key: Address]: PositionQuery[] } = {};
	for (const p of list.list) {
		const k: Address = p.collateral.toLowerCase() as Address;

		if (p.closed || p.denied) continue;

		if (sortedByCollateral[k] == undefined) sortedByCollateral[k] = [];
		sortedByCollateral[k].push(p);
	}

	const flatingPositions: PositionQuery[] = Object.values(sortedByCollateral).flat(1);
	let matchingPositions: PositionQuery[] = [];

	const m = { active: [] as PositionQuery[], inactive: [] as PositionQuery[] };
	for (const p of flatingPositions) {
		if (p.closed || p.denied) m.inactive.push(p);
		else m.active.push(p);
	}
	matchingPositions = m.active.concat(m.inactive);

	return (
		<Table>
			<TableHeader headers={["Collateral", "Collateralization", "Expiration", "Challenges"]} actionCol />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <MonitoringRow position={pos} key={pos.position} />)
				)}
			</TableBody>
		</Table>
	);
}
