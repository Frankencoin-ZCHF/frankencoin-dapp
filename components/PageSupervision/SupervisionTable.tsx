import SupervisionRow from "./SupervisionRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";

interface Props {
	showMyPos?: boolean;
}

export default function SupervisionTable({ showMyPos }: Props) {
	const { list } = useSelector((state: RootState) => state.positions);
	const { address } = useAccount();
	const account = address || zeroAddress;

	const sortedByCollateral: { [key: Address]: PositionQuery[] } = {};
	for (const p of list.list) {
		const k: Address = p.collateral.toLowerCase() as Address;

		if (showMyPos && p.owner !== account) continue;
		if (!showMyPos && (p.owner == account || p.closed || p.denied)) continue;

		if (sortedByCollateral[k] == undefined) sortedByCollateral[k] = [];
		sortedByCollateral[k].push(p);
	}

	const flatingPositions: PositionQuery[] = Object.values(sortedByCollateral).flat(1);
	let matchingPositions: PositionQuery[] = [];

	if (!showMyPos) {
		matchingPositions = flatingPositions;
	} else {
		const m = { active: [] as PositionQuery[], inactive: [] as PositionQuery[] };
		for (const p of flatingPositions) {
			if (p.closed || p.denied) m.inactive.push(p);
			else m.active.push(p);
		}
		matchingPositions = m.active.concat(m.inactive);
	}

	return (
		<Table>
			<TableHeader headers={["Collateral", "Balance", "Borrowed", "Liq. Price", "Challenges", "Maturity"]} />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{showMyPos ? "You do not have any positions" : "There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <SupervisionRow position={pos} key={pos.position} showMyPos={showMyPos} />)
				)}
			</TableBody>
		</Table>
	);
}
