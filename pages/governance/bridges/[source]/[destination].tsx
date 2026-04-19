import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Address, decodeAbiParameters } from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import {
	ADDRESS,
	CCIPAdminABI,
	ChainId,
	EquityABI,
	SupportedChain,
	SupportedChainIds,
	SupportedChainsMap,
} from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../../../../app.config";
import { ContractUrl, getChainByChainSelector, shortenAddress } from "@utils";
import AppTitle from "@components/AppTitle";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import AppToggle from "@components/AppToggle";
import Button from "@components/Button";
import ChainBySelect from "@components/Input/ChainBySelect";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import NormalInput from "@components/Input/NormalInput";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useDelegationHelpers } from "@hooks";

type RateLimiterState = {
	tokens: bigint;
	lastUpdated: number;
	isEnabled: boolean;
	capacity: bigint;
	rate: bigint;
};

type BridgePair = { sourceChainId: ChainId; destinationSelector: bigint };

const rateLimiterStateOutput = {
	type: "tuple",
	name: "",
	components: [
		{ name: "tokens", type: "uint128" },
		{ name: "lastUpdated", type: "uint32" },
		{ name: "isEnabled", type: "bool" },
		{ name: "capacity", type: "uint128" },
		{ name: "rate", type: "uint128" },
	],
} as const;

const tokenPoolReadABI = [
	{
		name: "getSupportedChains",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint64[]" }],
	},
	{
		name: "getRemoteToken",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [{ name: "", type: "bytes" }],
	},
	{
		name: "getCurrentInboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [rateLimiterStateOutput],
	},
	{
		name: "getCurrentOutboundRateLimiterState",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "chain", type: "uint64" }],
		outputs: [rateLimiterStateOutput],
	},
] as const;

export default function CCIPRateLimitPage() {
	const router = useRouter();

	const sourceParam = router.query.source as string | undefined;
	const destinationParam = router.query.destination as string | undefined;

	const sourceChainId = sourceParam ? (Number(sourceParam) as ChainId) : undefined;
	const destinationSelector = destinationParam ? safeBigInt(destinationParam) : undefined;

	const sourceChain = sourceChainId ? (SupportedChainsMap[sourceChainId] as SupportedChain | undefined) : undefined;
	const destinationChain = destinationSelector ? getChainByChainSelector(destinationSelector.toString()) : undefined;

	const [pairs, setPairs] = useState<BridgePair[]>([]);

	const [remoteToken, setRemoteToken] = useState<Address | null>(null);

	const [inEnabled, setInEnabled] = useState(false);
	const [inCapacity, setInCapacity] = useState<string>("");
	const [inRatePerHour, setInRatePerHour] = useState<string>("");
	const [outEnabled, setOutEnabled] = useState(false);
	const [outCapacity, setOutCapacity] = useState<string>("");
	const [outRatePerHour, setOutRatePerHour] = useState<string>("");

	const [isSubmitting, setSubmitting] = useState<boolean>(false);
	const { address } = useAccount();
	const { helpers } = useDelegationHelpers(address);

	// Fetch all bridge pairs once, for the dropdown navigation
	useEffect(() => {
		const fetcher = async () => {
			const results = await Promise.allSettled(
				SupportedChainIds.map(async (chainId) => {
					const pool = ADDRESS[chainId].ccipTokenPool;
					const selectors = await readContract(WAGMI_CONFIG, {
						address: pool,
						chainId,
						abi: tokenPoolReadABI,
						functionName: "getSupportedChains",
					});
					return { chainId, selectors };
				})
			);

			const collected: BridgePair[] = [];
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				for (const selector of r.value.selectors) {
					collected.push({ sourceChainId: r.value.chainId, destinationSelector: selector });
				}
			}
			setPairs(collected);
		};
		fetcher();
	}, []);

	// Fetch current state for the active bridge and prefill the form
	useEffect(() => {
		if (sourceChainId === undefined || destinationSelector === undefined) return;
		if (!(sourceChainId in ADDRESS)) return;

		setRemoteToken(null);

		const fetcher = async () => {
			const pool = ADDRESS[sourceChainId].ccipTokenPool;

			const [tokenBytes, inState, outState] = await Promise.all([
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getRemoteToken",
					args: [destinationSelector],
				}),
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getCurrentInboundRateLimiterState",
					args: [destinationSelector],
				}),
				readContract(WAGMI_CONFIG, {
					address: pool,
					chainId: sourceChainId,
					abi: tokenPoolReadABI,
					functionName: "getCurrentOutboundRateLimiterState",
					args: [destinationSelector],
				}),
			]);

			if (tokenBytes && tokenBytes !== "0x") {
				try {
					const [addr] = decodeAbiParameters([{ type: "address" }], tokenBytes);
					setRemoteToken(addr);
				} catch {
					setRemoteToken(null);
				}
			}

			const inTyped = inState as RateLimiterState;
			const outTyped = outState as RateLimiterState;

			setInEnabled(inTyped.isEnabled);
			setInCapacity(inTyped.capacity.toString());
			setInRatePerHour((inTyped.rate * 3600n).toString());
			setOutEnabled(outTyped.isEnabled);
			setOutCapacity(outTyped.capacity.toString());
			setOutRatePerHour((outTyped.rate * 3600n).toString());
		};
		fetcher();
	}, [sourceChainId, destinationSelector]);

	// Options for the two navigation dropdowns
	const sourceOptions = useMemo(() => {
		const ids = new Set<ChainId>();
		for (const p of pairs) ids.add(p.sourceChainId);
		return Array.from(ids)
			.map((id) => ({ id, name: (SupportedChainsMap[id] as SupportedChain).name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [pairs]);

	const destinationOptions = useMemo(() => {
		if (sourceChainId === undefined) return [];
		const seen = new Map<string, { selector: bigint; name: string }>();
		for (const p of pairs) {
			if (p.sourceChainId !== sourceChainId) continue;
			const name = getChainByChainSelector(p.destinationSelector.toString())?.name ?? p.destinationSelector.toString();
			seen.set(name, { selector: p.destinationSelector, name });
		}
		return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
	}, [pairs, sourceChainId]);

	const onSourceChange = (name: string) => {
		const newSource = sourceOptions.find((o) => o.name === name);
		if (!newSource) return;
		if (newSource.id === sourceChainId) return;

		// pick a destination on the new source — prefer same peer, else first
		const onNewSource = pairs.filter((p) => p.sourceChainId === newSource.id);
		if (onNewSource.length === 0) return;
		const same = onNewSource.find((p) => p.destinationSelector === destinationSelector);
		const next = same ?? onNewSource[0];
		router.push(`/governance/bridges/${newSource.id}/${next.destinationSelector.toString()}`);
	};

	const onDestinationChange = (name: string) => {
		const newDest = destinationOptions.find((o) => o.name === name);
		if (!newDest) return;
		if (newDest.selector === destinationSelector) return;
		router.push(`/governance/bridges/${sourceChainId}/${newDest.selector.toString()}`);
	};

	if (sourceChainId === undefined || destinationSelector === undefined) {
		return null;
	}

	if (!(sourceChainId in ADDRESS) || !sourceChain) {
		return (
			<AppCard>
				<div>Unknown source chain: {sourceParam}</div>
			</AppCard>
		);
	}

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		if (!address) return;

		const inConfig = buildConfig(inEnabled, inCapacity, inRatePerHour);
		const outConfig = buildConfig(outEnabled, outCapacity, outRatePerHour);

		try {
			setSubmitting(true);

			// CCIPAdmin.applyRateLimit labels its args from the remote chain's perspective:
			// its `inbound` slot forwards into the local TokenPool's outbound limit (and vice versa).
			// The UI uses local-pool semantics (matching getCurrentInbound/OutboundRateLimiterState),
			// so pass outConfig → CCIPAdmin.inbound, inConfig → CCIPAdmin.outbound.
			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[sourceChainId].ccipAdmin,
				chainId: sourceChainId,
				abi: CCIPAdminABI,
				functionName: "applyRateLimit",
				args: [destinationSelector, outConfig, inConfig, helpers],
			});

			const toastContent = [
				{ title: "Configured chain:", value: sourceChain.name },
				{ title: "Other chain:", value: destinationChain?.name ?? destinationSelector.toString() },
				{ title: "Transaction:", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Applying rate limits..." rows={toastContent} /> },
				success: { render: <TxToast title="Successfully applied rate limits" rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, [...CCIPAdminABI, ...EquityABI]));
		} finally {
			setSubmitting(false);
		}
	};

	const destinationLabel = destinationChain?.name ?? destinationSelector.toString();

	return (
		<>
			<Head>
				<title>Frankencoin - CCIP Rate Limit</title>
			</Head>

			<AppTitle title="CCIP Rate Limit">
				<div className="text-text-secondary">
					Configure the incoming and outgoing CCIP rate limits on{" "}
					<span className="font-medium text-text-primary">{sourceChain.name}</span> for transfers to and from{" "}
					<span className="font-medium text-text-primary">{destinationLabel}</span>. Rate limits use a token bucket: the pool holds
					up to <em>capacity</em> ZCHF and refills at the configured rate. When a limit is disabled, the bucket is bypassed and
					transfers flow without throttling. See the{" "}
					<AppLink
						label="Chainlink CCIP rate limit documentation"
						href="https://docs.chain.link/ccip/concepts/rate-limit-management/overview"
						external={true}
						className="inline"
					/>
					{" for details. Changes take effect immediately and require a qualified voter."}
				</div>
			</AppTitle>

			<AppCard>
				<div className="text-lg font-semibold">Bridge</div>
				<div className="flex flex-col">
					<InfoRow
						label="Configured chain"
						value={
							<ChainBySelect
								chains={sourceOptions.map((o) => o.name)}
								chain={sourceChain.name}
								chainOnChange={onSourceChange}
								invertColors={true}
							/>
						}
					/>
					<InfoRow
						label="Other chain"
						value={
							<ChainBySelect
								chains={destinationOptions.map((o) => o.name)}
								chain={destinationLabel}
								chainOnChange={onDestinationChange}
								invertColors={true}
							/>
						}
					/>
					<InfoRow label="CCIP chain selector" value={destinationSelector.toString()} />
					<InfoRow
						label="CCIPAdmin"
						value={
							<AppLink
								label={shortenAddress(ADDRESS[sourceChainId].ccipAdmin)}
								href={ContractUrl(ADDRESS[sourceChainId].ccipAdmin, sourceChain)}
								external={true}
								className="inline"
							/>
						}
					/>
					<InfoRow
						label="Token Pool"
						value={
							<AppLink
								label={shortenAddress(ADDRESS[sourceChainId].ccipTokenPool)}
								href={ContractUrl(ADDRESS[sourceChainId].ccipTokenPool, sourceChain)}
								external={true}
								className="inline"
							/>
						}
					/>
					<InfoRow
						label="Remote token"
						value={
							remoteToken ? (
								<AppLink
									label={shortenAddress(remoteToken)}
									href={ContractUrl(remoteToken, destinationChain)}
									external={true}
									className="inline"
								/>
							) : (
								"–"
							)
						}
					/>
				</div>
			</AppCard>

			<AppCard>
				<div className="text-lg font-semibold">New rate limits</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<RateLimitForm
						title="Incoming"
						description={`Throttles ZCHF arriving at ${sourceChain.name} from ${destinationLabel}.`}
						enabled={inEnabled}
						onEnabledChange={setInEnabled}
						capacity={inCapacity}
						onCapacityChange={setInCapacity}
						ratePerHour={inRatePerHour}
						onRatePerHourChange={setInRatePerHour}
					/>
					<RateLimitForm
						title="Outgoing"
						description={`Throttles ZCHF leaving ${sourceChain.name} for ${destinationLabel}.`}
						enabled={outEnabled}
						onEnabledChange={setOutEnabled}
						capacity={outCapacity}
						onCapacityChange={setOutCapacity}
						ratePerHour={outRatePerHour}
						onRatePerHourChange={setOutRatePerHour}
					/>
				</div>

				<div className="mt-4 md:max-w-xs md:ml-auto">
					<GuardSupportedChain chainId={sourceChainId}>
						<Button isLoading={isSubmitting} onClick={handleSubmit}>
							Apply rate limits
						</Button>
					</GuardSupportedChain>
				</div>
			</AppCard>
		</>
	);
}

function buildConfig(isEnabled: boolean, capacityStr: string, ratePerHourStr: string) {
	const capacity = capacityStr ? BigInt(capacityStr) : 0n;
	const ratePerHour = ratePerHourStr ? BigInt(ratePerHourStr) : 0n;
	const rate = ratePerHour / 3600n;
	return { isEnabled, capacity, rate };
}

function safeBigInt(v: string): bigint | undefined {
	try {
		return BigInt(v);
	} catch {
		return undefined;
	}
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-row justify-between items-center border-b border-card-input-border py-2">
			<div className="text-text-secondary">{label}</div>
			<div className="text-text-primary">{value}</div>
		</div>
	);
}

interface RateLimitFormProps {
	title: string;
	description: string;
	enabled: boolean;
	onEnabledChange: (v: boolean) => void;
	capacity: string;
	onCapacityChange: (v: string) => void;
	ratePerHour: string;
	onRatePerHourChange: (v: string) => void;
}

function RateLimitForm({
	title,
	description,
	enabled,
	onEnabledChange,
	capacity,
	onCapacityChange,
	ratePerHour,
	onRatePerHourChange,
}: RateLimitFormProps) {
	return (
		<div className="flex flex-col gap-3">
			<div>
				<div className="font-semibold">{title}</div>
				<div className="text-sm text-text-secondary">{description}</div>
			</div>
			<AppToggle label={enabled ? "Enabled" : "Disabled (bypassed)"} enabled={enabled} onChange={onEnabledChange} />
			<NormalInput
				label="Capacity (bucket size)"
				symbol="ZCHF"
				digit={18}
				value={capacity}
				onChange={onCapacityChange}
				disabled={!enabled}
				placeholder="0"
			/>
			<NormalInput
				label="Refill rate"
				symbol="ZCHF / h"
				digit={18}
				value={ratePerHour}
				onChange={onRatePerHourChange}
				disabled={!enabled}
				placeholder="0"
			/>
		</div>
	);
}
