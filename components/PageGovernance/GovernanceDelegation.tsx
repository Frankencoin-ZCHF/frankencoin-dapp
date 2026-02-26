import AppCard from "@components/AppCard";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Address, formatUnits, isAddress, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import { useReadContracts } from "wagmi";
import { useDelegationQuery, useDelegationHelpers } from "@hooks";
import { formatCurrency, shortenAddress } from "@utils";
import AddressInput from "@components/Input/AddressInput";
import ChainBySelect from "@components/Input/ChainBySelect";
import { WAGMI_CHAINS } from "../../app.config";
import GovernanceDelegationAction from "./GovernanceDelegationAction";
import GovernanceSyncAction from "./GovernanceSyncAction";

export default function GovernanceDelegation() {
	const account = useAccount();
	const chainId = useChainId();
	const myAddress: Address = account.address ?? zeroAddress;
	const isConnected = !!account.address;

	// delegation graph
	const delegationData = useDelegationQuery();
	const myDelegatedTo: Address = (delegationData.owners[myAddress.toLowerCase() as Address] ?? zeroAddress) as Address;

	// helpers for sync
	const { helpers } = useDelegationHelpers(account.address);
	const syncVoters: Address[] = isConnected ? [myAddress, ...helpers] : [];

	// read voting powers from mainnet equity
	const allAddresses: Address[] = isConnected ? [myAddress, ...helpers] : [];
	const contractReads = [
		...allAddresses.map((addr) => ({
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

	const totalVotes: bigint = readData ? (readData[allAddresses.length + 1]?.result as bigint) ?? 0n : 0n;
	const totalDelegated: bigint = readData ? (readData[allAddresses.length]?.result as bigint) ?? 0n : 0n;

	const votingPowers: bigint[] = allAddresses.map((_, i) => (readData ? (readData[i]?.result as bigint) ?? 0n : 0n));

	const myVotes = votingPowers[0] ?? 0n;
	const delegatorVotes: { address: Address; votes: bigint }[] = helpers
		.map((addr, i) => ({ address: addr, votes: votingPowers[i + 1] ?? 0n }))
		.sort((a, b) => (b.votes > a.votes ? 1 : -1));

	const formatPct = (v: bigint) => {
		if (!totalVotes || totalVotes === 0n) return "0.00%";
		const pct = (Number(v) / Number(totalVotes)) * 100;
		return `${formatCurrency(pct)}%`;
	};

	// actions state
	const [delegateAddr, setDelegateAddr] = useState<string>("");
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

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			{/* Left Card — Delegation List */}
			<AppCard>
				<div className="mt-2 text-lg font-bold text-center">Voting Delegation</div>

				{/* Header */}
				<div className="grid grid-cols-2 text-sm font-semibold text-text-secondary border-b border-card-input-border pb-1">
					<div>From</div>
					<div className="text-right">Voting</div>
				</div>

				{!isConnected ? (
					<div className="text-text-secondary text-sm text-center py-4">Connect wallet to see your delegation</div>
				) : (
					<>
						{/* Own row */}
						<div className="grid grid-cols-2 items-start py-1 border-b border-card-input-border">
							<div className="flex flex-col text-sm">
								<span className="font-semibold text-text-primary">You</span>
								{myDelegatedTo !== zeroAddress ? (
									<span className="text-text-secondary text-xs truncate">→ {shortenAddress(myDelegatedTo)}</span>
								) : (
									<span className="text-text-secondary text-xs">no delegation</span>
								)}
							</div>
							<div className="text-right text-sm font-semibold text-text-primary">{formatPct(myVotes)}</div>
						</div>

						{/* Delegator rows */}
						{delegatorVotes.map(({ address: addr, votes: vp }) => (
							<div key={addr} className="grid grid-cols-2 items-center py-1 border-b border-card-input-border">
								<div className="text-sm text-text-primary truncate">{shortenAddress(addr)}</div>
								<div className="text-right text-sm text-text-primary">{formatPct(vp)}</div>
							</div>
						))}

						{/* Total row */}
						<div className="grid grid-cols-2 items-center pt-2">
							<div className="text-sm font-semibold text-text-secondary">Total delegated</div>
							<div className="text-right text-sm font-bold text-text-primary">{formatPct(totalDelegated)}</div>
						</div>
					</>
				)}

				{/* Note */}
				<div className="text-text-secondary text-sm mt-auto">
					When syncing votes to another chain, the voting power of all your helpers (addresses that delegated to you, directly or
					recursively) is included in the sync.{" "}
					{syncVoters.length > 1 && isConnected && (
						<span className="text-text-primary font-medium">
							{syncVoters.length} address{syncVoters.length !== 1 ? "es" : ""} will be synced.
						</span>
					)}
				</div>
			</AppCard>

			{/* Right Card — Actions */}
			<AppCard>
				<div className="flex flex-col gap-4">
					{/* Delegate to address */}
					<div className="mt-2 text-lg font-bold text-center">Delegate Votes</div>

					<AddressInput
						label="Delegate to Address"
						placeholder="0x..."
						value={delegateAddr}
						onChange={handleDelegateChange}
						error={delegateError}
					/>

					<GovernanceDelegationAction delegate={delegateAddr} disabled={!isConnected || !isAddress(delegateAddr)} />

					{/* Divider */}
					<div className="border-t border-card-input-border" />

					{/* Sync votes to chain */}
					<div className="text-lg font-bold text-center">Sync Votes to Chain</div>

					<div className={`border-card-input-border hover:border-card-input-hover border-2 rounded-lg px-3 py-1`}>
						<div className="flex text-card-input-label my-1 text-sm text-text-secondary">Target Chain</div>
						<div className="flex justify-end">
							<ChainBySelect
								chains={sideChains.map((c) => c.name)}
								chain={syncChain}
								chainOnChange={(name: string) => setSyncChain(name)}
							/>
						</div>
					</div>

					<GovernanceSyncAction
						targetChainId={syncChainId}
						voters={syncVoters}
						disabled={!isConnected || syncVoters.length === 0}
					/>
				</div>
			</AppCard>
		</div>
	);
}
