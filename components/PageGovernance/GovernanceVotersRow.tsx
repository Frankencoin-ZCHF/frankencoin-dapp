import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useDelegationQuery } from "@hooks";
import { AddressLabelSimple } from "@components/AddressLabel";
import { VoteData } from "./GovernanceVotersTable";
import GovernanceVotersAction from "./GovernanceVotersAction";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { useAccount } from "wagmi";
import { ADDRESS, EquityABI } from "@deuro/eurocoin";
import { NATIVE_POOL_SHARE_TOKEN_SYMBOL } from "../../utils/constant";

interface Props {
	headers: string[];
	voter: VoteData;
	votesTotal: bigint;
	connectedWallet?: boolean;
}

export default function GovernanceVotersRow({ headers, voter, votesTotal, connectedWallet }: Props) {
	const [isDelegateeVotes, setDelegateeVotes] = useState<VoteData | undefined>(undefined);
	const delegationData = useDelegationQuery();
	const account = useAccount();
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
				const nativePS = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[WAGMI_CHAIN.id].equity,
					abi: EquityABI,
					functionName: "balanceOf",
					args: [delegatee],
				});

				const votingPowerRatio = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[WAGMI_CHAIN.id].equity,
					abi: EquityABI,
					functionName: "relativeVotes",
					args: [delegatee],
				});

				const votingPower = votingPowerRatio * votesTotal;

				setDelegateeVotes({ holder: delegatee, nativePS, votingPower, votingPowerRatio: parseFloat(formatUnits(votingPowerRatio, 18)) });
			};

			fetcher();
		}
	}, [isDelegateeVotes, isDelegated, isRevoked, delegatee, voter, votesTotal]);

	return (
		<>
			<TableRow
				className={connectedWallet ? "bg-card-content-primary" : undefined}
				headers={headers}
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
							<AddressLabelSimple address={voter.holder} label="Connected wallet" showLink />
						) : (
							<AddressLabelSimple address={voter.holder} showLink />
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

				<div className="flex flex-col">{formatCurrency(formatUnits(voter.nativePS, 18))} {NATIVE_POOL_SHARE_TOKEN_SYMBOL}</div>
				<div className={`flex flex-col`}>{formatCurrency(voter.votingPowerRatio * 100)}%</div>
			</TableRow>

			{connectedWallet && isDelegated && !isRevoked ? (
				<TableRow
					className="bg-card-content-primary"
					actionCol={
						<GovernanceVotersAction
							key={voter.holder}
							voter={voter}
							connectedWallet={connectedWallet}
							disabled={connectedWallet && (!isDelegated || (isDelegated && isRevoked))}
						/>
					}
				>
					<AddressLabelSimple className="text-left" address={delegatee} label="Delegate address" showLink />
					<div className="flex flex-col">{formatCurrency(formatUnits(isDelegateeVotes?.nativePS || 0n, 18))} {NATIVE_POOL_SHARE_TOKEN_SYMBOL}</div>
					<div className={`flex flex-col`}>{formatCurrency((isDelegateeVotes?.votingPowerRatio || 0) * 100)}%</div>
				</TableRow>
			) : null}
		</>
	);
}
