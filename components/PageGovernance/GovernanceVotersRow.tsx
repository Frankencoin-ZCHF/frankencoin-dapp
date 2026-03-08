import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, formatDuration, shortenAddress } from "../../utils/format";
import { useDelegationQuery } from "@hooks";
import { AddressLabelSimple } from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersAction from "./GovernanceVotersAction";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useAccount } from "wagmi";
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
	const [isDelegateeVotes, setDelegateeVotes] = useState<VoteData | undefined>(undefined);
	const delegationData = useDelegationQuery();
	const account = useAccount();
	const chainId = mainnet.id;
	const sender: Address = account.address || zeroAddress;

	const delegatedFrom = delegationData.delegatees[voter.holder.toLowerCase() as Address] || [];
	const delegatedTo = delegationData.owners[voter.holder.toLowerCase() as Address] || zeroAddress;
	const isDelegated: boolean = delegatedTo != zeroAddress;
	const isRevoked: boolean = isDelegated && delegatedTo.toLowerCase() == voter.holder.toLowerCase();
	const isAccountDelegatedFrom: boolean = delegatedFrom.includes(sender.toLowerCase() as Address);

	useEffect(() => {
		if (!isDelegateeVotes && isDelegated && !isRevoked) {
			const fetcher = async function () {
				const fps = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "balanceOf",
					args: [delegatedTo],
				});

				const votingPowerRatio = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "relativeVotes",
					args: [delegatedTo],
				});

				const holdingDuration = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "holdingDuration",
					args: [delegatedTo],
				});

				const votingPower = votingPowerRatio * votesTotal;

				setDelegateeVotes({
					holder: delegatedTo,
					balance: fps,
					votingPower,
					votingPowerRatio: parseFloat(formatUnits(votingPowerRatio, 18)),
					holdingDuration: holdingDuration,
				});
			};

			fetcher();
		}
	}, [isDelegateeVotes, isDelegated, isRevoked, delegatedTo, voter, votesTotal, chainId]);

	return (
		<>
			<TableRow className={connectedWallet ? "bg-card-content-primary" : undefined} headers={headers} rawHeader={true} tab={tab}>
				{/* Owner */}
				<div className="flex items-center">
					<div className="flex flex-col md:text-left max-md:text-right max-md:w-full">
						{connectedWallet ? (
							<AppLink label={"Connected wallet"} href={ContractUrl(voter.holder)} external={true} className="" />
						) : (
							<AppLink label={shortenAddress(voter.holder)} href={ContractUrl(voter.holder)} external={true} className="" />
						)}
						{isDelegated && !isRevoked ? (
							<AddressLabelSimple
								className="text-sm"
								address={delegatedTo}
								label={`Delegating to: ${shortenAddress(delegatedTo)}`}
							/>
						) : null}
					</div>
				</div>

				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					{formatCurrency(voter.votingPowerRatio * 100)}%
				</div>
			</TableRow>

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
							disabled={connectedWallet && (!isDelegated || (isDelegated && isRevoked))}
						/>
					}
				>
					<AppLink label={"Delegate Address"} href={ContractUrl(delegatedTo)} external={true} className="text-left" />
					<div className="">{formatCurrency((isDelegateeVotes?.votingPowerRatio || 0) * 100)}%</div>
				</TableRow>
			) : null}
		</>
	);
}
