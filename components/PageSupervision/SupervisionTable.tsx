import SupervisionRow from "./SupervisionRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@frankencoin/api";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";

interface Props {
	showMyPos?: boolean;
}

export default function SupervisionTable({ showMyPos }: Props) {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const { address } = useAccount();
	const account = address || zeroAddress;
	const openPositions: PositionQuery[] = [];

	for (const collateral in openPositionsByCollateral) {
		openPositions.push(...openPositionsByCollateral[collateral]);
	}

	const matchingPositions: PositionQuery[] = openPositions.filter((position) =>
		showMyPos ? position.owner === account : position.owner !== account && !position.closed && !position.denied
	);

	return (
		<Table>
			<TableHeader headers={["Collateral", "Balance", "Borrowed", "Liq. Price", "Challenges", "Maturity"]} />
			<TableBody>
				{matchingPositions.length == 0 ? (
					<TableRowEmpty>{"There are no other positions yet."}</TableRowEmpty>
				) : (
					matchingPositions.map((pos) => <SupervisionRow position={pos} key={pos.position} showMyPos={showMyPos} />)
				)}
			</TableBody>
		</Table>
	);
}
