import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import MyPositionsChallengesRow from "./MyPositionsChallengesRow";
import { useAccount } from "wagmi";
import { Address, zeroAddress } from "viem";
import { ChallengesQueryItem } from "@frankencoin/api";

export default function MyPositionsChallengesTable() {
	const { address } = useAccount();
	const { challengers } = useSelector((state: RootState) => state.challenges);
	const challenger: ChallengesQueryItem[] = !address ? [] : challengers.map[(address.toLowerCase() as Address) || zeroAddress] || [];

	return (
		<Table>
			<TableHeader headers={["Remaining Size", "Current Price", "State", "Time Left"]} actionCol />
			<TableBody>
				{challenger.length == 0 ? (
					<TableRowEmpty>{"You do not have any challenges yet."}</TableRowEmpty>
				) : (
					challenger.map((c) => <MyPositionsChallengesRow key={c.id} challenge={c} />)
				)}
			</TableBody>
		</Table>
	);
}
