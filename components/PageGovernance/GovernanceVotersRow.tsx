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
	const delegatedTo = delegationData.delegaters[voter.holder.toLowerCase() as Address] || [];
	const delegatee = delegatedTo.at(0) || zeroAddress;
	const isDelegated: boolean = delegatedTo.length > 0;
	const isRevoked: boolean = isDelegated && delegatedTo[0].toLowerCase() == voter.holder.toLowerCase();
	const isAccountDelegatedFrom: boolean = delegatedFrom.includes(sender.toLowerCase() as Address);

	useEffect(() => {
		if (!isDelegateeVotes && isDelegated && !isRevoked) {
			const fetcher = async function () {
				const fps = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "balanceOf",
					args: [delegatee],
				});

				const votingPowerRatio = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "relativeVotes",
					args: [delegatee],
				});

				const holdingDuration = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					chainId: chainId,
					abi: EquityABI,
					functionName: "holdingDuration",
					args: [delegatee],
				});

				const votingPower = votingPowerRatio * votesTotal;

				setDelegateeVotes({
					holder: delegatee,
					fps,
					votingPower,
					votingPowerRatio: parseFloat(formatUnits(votingPowerRatio, 18)),
					holdingDuration: holdingDuration,
				});
			};

			fetcher();
		}
	}, [isDelegateeVotes, isDelegated, isRevoked, delegatee, voter, votesTotal, chainId]);

	return (
		<>
			<TableRow
				className={connectedWallet ? "bg-card-content-primary" : undefined}
				headers={headers}
				rawHeader={true}
				tab={tab}
				actionCol={
					connectedWallet ? (
						<></>
					) : (
						<GovernanceVotersAction
							key={voter.holder}
							voter={voter}
							connectedWallet={connectedWallet}
							disabled={(connectedWallet && (!isDelegated || (isDelegated && isRevoked))) || isAccountDelegatedFrom}
						/>
					)
				}
			>
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
								address={delegatee}
								label={`Delegating to: ${shortenAddress(delegatee)}`}
							/>
						) : null}
					</div>
				</div>

				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					{formatCurrency(formatUnits(voter.fps, 18))} FPS
				</div>
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					{formatCurrency(voter.votingPowerRatio * 100)}%
				</div>
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>{formatDuration(voter.holdingDuration)}</div>
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
					<AppLink label={"Delegate Address"} href={ContractUrl(delegatee)} external={true} className="text-left" />
					<div className="">{formatCurrency(formatUnits(isDelegateeVotes?.fps || 0n, 18))} FPS</div>
					<div className="">{formatCurrency((isDelegateeVotes?.votingPowerRatio || 0) * 100)}%</div>
					<div className="">{formatDuration(isDelegateeVotes?.holdingDuration || 0)}</div>
				</TableRow>
			) : null}
		</>
	);
}
