import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency } from "../../utils/format";
import { useContractUrl } from "@hooks";
import AddressLabel from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersAction from "./GovernanceVotersAction";

interface Props {
	voter: VoteData;
}

export default function GovernanceVotersRow({ voter }: Props) {
	const url = useContractUrl(voter.holder || zeroAddress);
	if (!voter) return null;

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernanceVotersAction key={voter.holder} voter={voter} />
				</div>
			}
		>
			{/* Owner */}
			<div className="flex items-center">
				<AddressLabel address={voter.holder} showCopy showLink />
			</div>

			{/* FPS */}
			<div className="flex flex-col">{formatCurrency(formatUnits(voter.fps, 18))} FPS</div>

			{/* Voting Power */}
			<div className={`flex flex-col ${voter.votingPowerRatio > 0.02 ? "font-bold" : ""}`}>
				{formatCurrency(voter.votingPowerRatio * 100)}% Votes
			</div>
		</TableRow>
	);
}
