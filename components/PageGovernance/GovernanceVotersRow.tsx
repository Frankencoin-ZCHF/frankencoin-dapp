import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import TableRow from "../Table/TableRow";
import { formatCurrency, normalizeAddress, shortenAddress } from "../../utils/format";
import { track, VotingSystem, VoteDataQuote } from "@hooks";
import AppLink from "@components/AppLink";
import AppButtonSecondary from "@components/AppButtonSecondary";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { ContractUrl } from "@utils";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { Address } from "viem";
import { mainnet } from "viem/chains";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	headers: string[];
	tab: string;
	voter: VoteDataQuote;
	votesTotal: bigint;
	system?: VotingSystem;
	myVotes?: bigint;
	fcsIsBinding?: boolean;
	connectedWallet?: boolean;
}

export default function GovernanceVotersRow({
	headers,
	tab,
	voter,
	votesTotal,
	system = "fps1",
	myVotes = 0n,
	fcsIsBinding = false,
	connectedWallet,
}: Props) {
	const [isAction, setAction] = useState<boolean>(false);

	const votingPower = voter.votingPowerRatio + voter.supportedVotingPowerRatio;
	const supporterCount = voter.supporters.length;
	const isWrapped = normalizeAddress(voter.holder) === normalizeAddress(ADDRESS[mainnet.id].wFPS);
	// FCS.sol's constructor delegates all of FCS's pooled FPS1 votes to a single "helper" address
	// returned by GovernanceFactory.deploy() — verified on-chain (via the indexed Delegation event,
	// owner=FCS) that this is `interestGovernance`, not `mainnetVotes` as might be assumed from the
	// naming. So on the FPS1 tab this row represents "all wrapped FCS holders combined", not an individual.
	const isFcsWrapper = normalizeAddress(voter.holder) === normalizeAddress(ADDRESS[mainnet.id].interestGovernance);

	// FCS.shoot(target) is only available once FCS is binding, and only ever destroys a target's FPS1
	// votes — it costs the caller nothing since FCS spends its own pooled votes as the budget internally.
	// Otherwise, on FPS1 it's Equity.kamikaze(targets, votesToDestroy), which does cost the caller their
	// own votes. On the FCS tab it's always FCS.attack, same shape as kamikaze.
	const isShoot = system === "fps1" && fcsIsBinding;
	const actionLabel = isShoot ? "Shoot" : "Kamikaze";

	// shoot()/kamikaze()/attack() all key off the target's own votes() — a pure delegation recipient
	// (like the isFcsWrapper row, whose own FPS1 balance is 0) has nothing to destroy and the tx reverts.
	const targetHasVotes = voter.votingPower > 0n;
	const isFcsSelfTarget = isShoot && normalizeAddress(voter.holder) === normalizeAddress(ADDRESS[mainnet.id].fcs);
	const isActionDisabled = !targetHasVotes || isFcsSelfTarget || (!isShoot && myVotes === 0n);

	const handleAction = async (e: any) => {
		e.preventDefault();
		if (isActionDisabled) return;

		const contractAddress = isShoot || system === "fcs" ? ADDRESS[mainnet.id].fcs : ADDRESS[mainnet.id].equity;
		const abi = isShoot || system === "fcs" ? FCSABI : EquityABI;

		try {
			setAction(true);

			const writeHash = isShoot
				? await writeContract(WAGMI_CONFIG, {
						address: contractAddress,
						chainId: mainnet.id,
						abi,
						functionName: "shoot",
						args: [voter.holder as Address],
				  })
				: await writeContract(WAGMI_CONFIG, {
						address: contractAddress,
						chainId: mainnet.id,
						abi,
						functionName: system === "fcs" ? "attack" : "kamikaze",
						args: [[voter.holder as Address], myVotes],
				  });

			const toastContent = [
				{ title: "Target: ", value: shortenAddress(voter.holder) },
				{ title: "Transaction: ", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title={`${actionLabel} in progress...`} rows={toastContent} /> },
				success: { render: <TxToast title={`${actionLabel} successful`} rows={toastContent} /> },
			});

			track("votes_destroyed", { system, action: actionLabel.toLowerCase() });
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, abi));
		} finally {
			setAction(false);
		}
	};

	return (
		<>
			<TableRow
				className={connectedWallet ? "bg-card-content-primary" : undefined}
				headers={headers}
				rawHeader={true}
				tab={tab}
				actionCol={
					connectedWallet || isFcsSelfTarget ? (
						<div className="h-10" />
					) : (
						<GuardSupportedChain chain={mainnet}>
							<AppButtonSecondary className="h-10" disabled={isActionDisabled} isLoading={isAction} onClick={handleAction}>
								{actionLabel}
							</AppButtonSecondary>
						</GuardSupportedChain>
					)
				}
			>
				{/* Address + supporter count as sub-text */}
				<div className="flex flex-col md:text-left max-md:text-right max-md:w-full">
					<div className="flex items-center gap-2">
						{connectedWallet ? (
							<AppLink label={"Connected wallet"} href={ContractUrl(voter.holder)} external={true} className="" />
						) : (
							<AppLink label={shortenAddress(voter.holder)} href={ContractUrl(voter.holder)} external={true} className="" />
						)}
						{isWrapped && (
							<span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
								Wrapped
							</span>
						)}
						{isFcsWrapper && (
							<span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
								FCS
							</span>
						)}
					</div>
					{supporterCount > 0 && (
						<span className="text-sm text-text-subheader">
							{supporterCount} supporter{supporterCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>

				{/* Voting power + supported VP ratio as sub-text */}
				<div className={`flex flex-col ${connectedWallet ? "font-semibold" : ""}`}>
					<span>{formatCurrency(votingPower * 100)}%</span>
					{supporterCount > 0 && (
						<span className="text-sm text-text-subheader font-normal">
							{formatCurrency(voter.supportedVotingPowerRatio * 100)}%
						</span>
					)}
				</div>
			</TableRow>
		</>
	);
}
