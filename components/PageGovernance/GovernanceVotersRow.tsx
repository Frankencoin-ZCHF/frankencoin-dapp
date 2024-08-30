import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useContractUrl, useDelegationQuery } from "@hooks";
import AddressLabel from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersAction from "./GovernanceVotersAction";

interface Props {
	voter: VoteData;
	connectedWallet?: boolean;
}

export default function GovernanceVotersRow({ voter, connectedWallet }: Props) {
	const url = useContractUrl(voter.holder || zeroAddress);
	const delegationData = useDelegationQuery();
	if (!voter) return null;

	const delegatedTo = delegationData.delegaters[voter.holder.toLowerCase() as Address] || [];
	const delegatee = delegatedTo.at(0) || zeroAddress;
	const isDelegated: boolean = delegatedTo.length > 0;
	const isRevoked: boolean = isDelegated && delegatedTo[0].toLowerCase() == voter.holder.toLowerCase();

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernanceVotersAction
						key={voter.holder}
						voter={voter}
						connectedWallet={connectedWallet}
						disabled={connectedWallet && (!isDelegated || (isDelegated && isRevoked))}
					/>
				</div>
			}
			className={connectedWallet ? "bg-gray-800" : undefined}
		>
			{/* Owner */}
			<div className="flex items-center">
				<div className="flex flex-col">
					{connectedWallet ? (
						<span className="text-left">Connected wallet</span>
					) : (
						<AddressLabel address={voter.holder} showCopy showLink />
					)}
					{isDelegated && !isRevoked ? (
						<span className="text-xs text-left">Delegating to: {shortenAddress(delegatee)}</span>
					) : null}
				</div>
			</div>

			{/* FPS */}
			<div className="flex flex-col">{formatCurrency(formatUnits(voter.fps, 18))} FPS</div>

			{/* Voting Power */}
			<div className={`flex flex-col`}>
				{formatCurrency(voter.votingPowerRatio * 100)}%
			</div>
		</TableRow>
	);
}
