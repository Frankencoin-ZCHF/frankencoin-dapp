import AppCard from "@components/AppCard";
import { useState } from "react";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { Address, isAddress, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import { useDelegationQuery, useDelegationHelpers, useVotesSynced } from "@hooks";
import { formatCurrency, shortenAddress } from "@utils";
import AddressInput from "@components/Input/AddressInput";
import ChainSyncedVotes from "@components/Input/ChainSyncedVotes";
import { WAGMI_CHAINS } from "../../app.config";
import GovernanceDelegationAction from "./GovernanceDelegationAction";
import GovernanceSyncAction from "./GovernanceSyncAction";

export default function GovernanceDelegation() {
	const account = useAccount();
	useChainId();
	const myAddress: Address = account.address ?? zeroAddress;
	const isConnected = !!account.address;

	// delegation graph
	const delegationData = useDelegationQuery();
	const myDelegatedTo: Address = (delegationData.owners[myAddress.toLowerCase() as Address] ?? zeroAddress) as Address;

	// helpers (supporters) for sync and display
	const { helpers, supporterCount } = useDelegationHelpers(account.address);
	const voters: Address[] = isConnected ? [myAddress, ...helpers] : [];

	// read voting powers from mainnet equity
	const contractReads = [
		...voters.map((addr) => ({
			address: ADDRESS[mainnet.id].equity,
			chainId: mainnet.id,
			abi: EquityABI,
			functionName: "votes" as const,
			args: [addr] as [Address],
		})),
		{
			address: ADDRESS[mainnet.id].equity,
			chainId: mainnet.id,
			abi: EquityABI,
			functionName: "votesDelegated" as const,
			args: [myAddress, helpers] as [Address, Address[]],
		},
		{
			address: ADDRESS[mainnet.id].equity,
			chainId: mainnet.id,
			abi: EquityABI,
			functionName: "totalVotes" as const,
			args: [] as [],
		},
	];

	const { data: readData } = useReadContracts({ contracts: contractReads as any });

	const totalVotes: bigint = readData ? ((readData[voters.length + 1]?.result as bigint) ?? 0n) : 0n;
	const totalDelegated: bigint = readData ? ((readData[voters.length]?.result as bigint) ?? 0n) : 0n;
	const votingPowers: bigint[] = voters.map((_, i) => (readData ? ((readData[i]?.result as bigint) ?? 0n) : 0n));

	const myVotes = votingPowers[0] ?? 0n;
	const delegatorVotes: { address: Address; votes: bigint }[] = helpers
		.map((addr, i) => ({ address: addr, votes: votingPowers[i + 1] ?? 0n }))
		.sort((a, b) => (b.votes > a.votes ? 1 : -1));

	const formatPct = (v: bigint) => {
		if (!totalVotes || totalVotes === 0n) return "0.00%";
		return `${formatCurrency((Number(v) / Number(totalVotes)) * 100)}%`;
	};

	// delegate address input
	const [delegateAddr, setDelegateAddr] = useState<string>(myDelegatedTo !== zeroAddress ? myDelegatedTo : "");
	const [delegateError, setDelegateError] = useState<string>("");

	const handleDelegateChange = (value: string) => {
		setDelegateAddr(value);
		if (value === "") setDelegateError("");
		else if (!isAddress(value)) setDelegateError("Not a valid address");
		else setDelegateError("");
	};

	// sync chain selector (sidechains only — sync always goes FROM mainnet)
	const sideChains = WAGMI_CHAINS.filter((c) => c.id !== mainnet.id);
	const [syncChain, setSyncChain] = useState<string>(sideChains[0]?.name ?? "");
	const syncChainId = WAGMI_CHAINS.find((c) => c.name === syncChain)?.id ?? sideChains[0]?.id ?? 0;

	// synced votes on the selected target chain
	const { syncedVotes, totalVotes: syncTotalVotes } = useVotesSynced(myAddress, helpers, syncChainId);
	const syncedPct =
		syncTotalVotes > 0n ? `${formatCurrency((Number(syncedVotes) / Number(syncTotalVotes)) * 100)}%` : "—";

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			{/* Left Card — Support List */}
			<AppCard>
				<div className="mt-2 text-lg font-bold text-center">Voting Support</div>

				{/* Header */}
				<div className="grid grid-cols-2 text-sm font-semibold text-text-secondary border-b border-card-input-border pb-1">
					<div>From</div>
					<div className="text-right">Voting</div>
				</div>

				{!isConnected ? (
					<div className="text-text-secondary text-sm text-center py-4">Connect wallet to see your supporters</div>
				) : (
					<>
						{/* Own row */}
						<div className="grid grid-cols-2 items-start py-1 border-b border-card-input-border">
							<div className="flex flex-col text-sm">
								<span className="font-semibold text-text-primary">You</span>
								{myDelegatedTo !== zeroAddress ? (
									<span className="text-text-secondary text-xs truncate">→ {shortenAddress(myDelegatedTo)}</span>
								) : supporterCount > 0 ? (
									<span className="text-text-secondary text-xs">
										{supporterCount} supporter{supporterCount !== 1 ? "s" : ""}
									</span>
								) : (
									<span className="text-text-secondary text-xs">no supporters yet</span>
								)}
							</div>
							<div className="text-right text-sm font-semibold text-text-primary">{formatPct(myVotes)}</div>
						</div>

						{/* Supporter rows */}
						{delegatorVotes.map(({ address: addr, votes: vp }) => (
							<div key={addr} className="grid grid-cols-2 items-center py-1 border-b border-card-input-border">
								<div className="text-sm text-text-primary truncate">{shortenAddress(addr)}</div>
								<div className="text-right text-sm text-text-primary">{formatPct(vp)}</div>
							</div>
						))}

						{/* Total row */}
						<div className="grid grid-cols-2 items-center pt-2">
							<div className="text-sm font-semibold text-text-secondary">Total</div>
							<div className="text-right text-sm font-bold text-text-primary">{formatPct(totalDelegated)}</div>
						</div>
					</>
				)}

				{/* Note */}
				<div className="text-text-secondary text-sm mt-auto">
					You can group up with other FPS holders by forming a supporter chain or circle to increase the combined voting power of
					the group. All addresses that have supported to you — directly or recursively — are your{" "}
					<span className="text-text-primary font-medium">supporters</span>. When syncing votes to another chain, the voting power
					of you and all your supporters is included in the sync.{" "}
					{voters.length > 1 && isConnected && (
						<span className="text-text-primary font-medium">
							{voters.length} address{voters.length !== 1 ? "es" : ""} will be synced.
						</span>
					)}
				</div>
			</AppCard>

			{/* Right Card — Actions */}
			<AppCard>
				<div className="flex flex-col gap-4">
					{/* Delegate to address */}
					<div className="mt-2 text-lg font-bold text-center">Support an Address</div>

					<AddressInput
						label="Supported Address"
						placeholder="Enter the address here"
						value={delegateAddr}
						reset={myDelegatedTo !== zeroAddress ? zeroAddress : undefined}
						onChange={handleDelegateChange}
						error={delegateError}
					/>

					<GovernanceDelegationAction delegate={delegateAddr} disabled={!isConnected || !isAddress(delegateAddr)} />

					{/* Divider */}
					<div className="border-t border-card-input-border" />

					{/* Sync votes to chain */}
					<div className="text-lg font-bold text-center">Sync Votes to Chain</div>

					<ChainSyncedVotes
						label="Votes on Target Chain"
						chains={sideChains.map((c) => c.name)}
						chain={syncChain}
						onChangeChain={(name: string) => setSyncChain(name)}
						pct={syncedPct}
					/>

					<GovernanceSyncAction
						targetChainId={syncChainId}
						voters={voters}
						disabled={!isConnected || voters.length === 0}
					/>
				</div>
			</AppCard>
		</div>
	);
}
