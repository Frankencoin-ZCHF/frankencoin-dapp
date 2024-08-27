import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { MinterQuery } from "@frankencoin/api";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import AddressLabel from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersDelegate from "./GovernanceVotersAction";

interface Props {
	voter: VoteData;
}

export default function GovernancePositionsRow({ voter }: Props) {
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
					<GovernanceVotersDelegate key={voter.holder} />
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
			<div className={`flex flex-col`}>{formatCurrency(voter.votingPowerRatio * 100)}% Votes</div>
		</TableRow>
	);
}
