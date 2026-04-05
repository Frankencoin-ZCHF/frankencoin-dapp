import { Address, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useDelegationHelpers, useDelegationQuery } from "@hooks";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersAction from "./GovernanceVotersAction";
import { useReadContracts } from "wagmi";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { ContractUrl } from "@utils";
import { mainnet } from "viem/chains";

interface Props {
	headers: string[];
	tab: string;
	voter: VoteData;
	votesTotal: bigint;
	connectedWallet?: boolean;
}

export default function GovernanceVotersRow({ headers, tab, voter, votesTotal, connectedWallet }: Props) {
	const delegationData = useDelegationQuery();
	const { helpers } = useDelegationHelpers(voter.holder);
	const supporterCount = voter.supporterCount;

	const delegatedTo = (delegationData.owners[voter.holder.toLowerCase() as Address] ?? zeroAddress) as Address;
	const isDelegated = delegatedTo !== zeroAddress;
	const isRevoked = isDelegated && delegatedTo.toLowerCase() === voter.holder.toLowerCase();

	// Only fetch votesDelegated when there are helpers — otherwise fall back to own votes
	const { data: contractData } = useReadContracts({
		contracts: [
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "votesDelegated" as const,
				args: [voter.holder, helpers] as [Address, Address[]],
			},
		],
		query: { enabled: helpers.length > 0 },
	});

	const totalVotes: bigint = (contractData?.[0]?.result as bigint) ?? voter.votingPower;
	const totalVotingPowerRatio = votesTotal > 0n ? Number(totalVotes) / Number(votesTotal) : 0;

	return (
		<>
			<TableRow className={connectedWallet ? "bg-card-content-primary" : undefined} headers={headers} rawHeader={true} tab={tab}>
				{/* Address + supporter info */}
				<div className="flex items-center">
					<div className="flex flex-col md:text-left max-md:text-right max-md:w-full">
						{connectedWallet ? (
							<AppLink label={"Connected wallet"} href={ContractUrl(voter.holder)} external={true} className="" />
						) : (
							<AppLink label={shortenAddress(voter.holder)} href={ContractUrl(voter.holder)} external={true} className="" />
						)}
							</div>
				</div>

				{/* Supporters */}
				<div className="flex flex-col">
					{supporterCount > 0 ? supporterCount : "-"}
				</div>

				{/* Voting power incl. supporters */}
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					{formatCurrency(totalVotingPowerRatio * 100)}%
				</div>
			</TableRow>

			{/* Sub-row: revoke delegation for connected wallet */}
			{connectedWallet && isDelegated && !isRevoked ? (
				<TableRow
					className="bg-card-content-primary"
					tab={tab}
					rawHeader={true}
					actionCol={
						<GovernanceVotersAction
							key={voter.holder}
							voter={voter}
							connectedWallet={connectedWallet}
							disabled={false}
						/>
					}
				>
					<AppLink label={"Delegate Address"} href={ContractUrl(delegatedTo)} external={true} className="text-left" />
					<div />
				</TableRow>
			) : null}
		</>
	);
}
