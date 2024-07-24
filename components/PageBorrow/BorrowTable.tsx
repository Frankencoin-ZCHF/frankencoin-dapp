import PositionRow from "./BorrowRow";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ChallengesQueryItem, PositionQuery } from "@frankencoin/api";
import { Address } from "viem";

export default function BorrowTable() {
	const { openPositionsByCollateral } = useSelector((state: RootState) => state.positions);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);
	const openPositions: PositionQuery[] = openPositionsByCollateral.flat(1);

	const matchingPositions: PositionQuery[] = openPositions.filter((position) => {
		const considerOpen: boolean = !position.closed && !position.denied;
		const considerProposed: boolean = position.start * 1000 < Date.now();
		const considerAvailableForClones: boolean = BigInt(position.availableForClones) > 0n;

		const challengesPosition = challengesPosMap[position.position.toLowerCase() as Address] || [];
		const challengesActive: ChallengesQueryItem[] = challengesPosition.filter((c) => c.status == "Active");
		const considerNoChallenges: boolean = challengesActive.length == 0;

		const verifyable: boolean[] = [considerOpen, considerProposed, considerAvailableForClones, considerNoChallenges];

		return !verifyable.includes(false);
	});

	return (
		<Table>
			<TableHeader headers={["Collateral", "Loan-to-Value", "Interest", "Available", "Maturity"]} actionCol />
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
