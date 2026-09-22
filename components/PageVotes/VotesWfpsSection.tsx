import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import AppCard from "@components/AppCard";
import DisplayLabel from "@components/DisplayLabel";
import GovernanceWfpsHalveAction from "@components/PageGovernance/GovernanceWfpsHalveAction";
import { ContractUrl, decodeBigIntCall, formatCurrency, formatDuration, FormatType } from "@utils";

export default function VotesWfpsSection() {
	const wfpsAddress = ADDRESS[mainnet.id].wFPS;
	const votingContract = { address: ADDRESS[mainnet.id].equity, chainId: mainnet.id, abi: EquityABI } as const;

	const { data } = useReadContracts({
		contracts: [
			{ ...votingContract, functionName: "balanceOf", args: [wfpsAddress] },
			{ ...votingContract, functionName: "votes", args: [wfpsAddress] },
			{ ...votingContract, functionName: "holdingDuration", args: [wfpsAddress] },
			{ ...votingContract, functionName: "relativeVotes", args: [wfpsAddress] },
		],
	});

	const wrappedBalance = data ? decodeBigIntCall(data[0]) : 0n;
	const votingPower = data ? decodeBigIntCall(data[1]) : 0n;
	const holdingDuration = data ? decodeBigIntCall(data[2]) : 0n;
	const relativeVotes = data ? decodeBigIntCall(data[3]) : 0n;

	return (
		<>
			<AppTitle title="Wrapped Frankencoin Pool Shares">
				<div className="text-text-secondary">
					<AppLink className="inline" label="WFPS (Wrapped Frankencoin Pool Share)" href={ContractUrl(wfpsAddress)} external={true} />{" "}
					wraps FPS 1:1 as a plain, freely tradable token — handy for moving FPS around or into other protocols — while still
					letting holders redeem into Frankencoin directly once enough voting power has accumulated. It accumulates voting power
					like any FPS holder, but implements no governance mechanism of its own — no delegation, no sync, no proposals. The only
					lever anyone has over its votes is{" "}
					<span className="font-medium text-text-primary">halveHoldingDuration</span>: any qualified FPS holder (2% veto threshold,
					own vote plus supporters) can reset its recorded holding duration to half, cutting its voting power roughly in half —
					keeping it from silently accumulating outsized power since nobody wrapped inside it actively participates in governance.
				</div>
			</AppTitle>

			<AppCard>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<DisplayLabel label="Wrapped FPS">
						<div className="font-semibold">{formatCurrency(formatUnits(wrappedBalance, 18))} FPS</div>
					</DisplayLabel>
					<DisplayLabel label="Voting Power">
						<div className="font-semibold">{formatCurrency(formatUnits(votingPower, 18), 2, 2, FormatType.symbol)}</div>
					</DisplayLabel>
					<DisplayLabel label="Share of FPS Votes">
						<div className="font-semibold">{formatCurrency(parseFloat(formatUnits(relativeVotes, 18)) * 100)}%</div>
					</DisplayLabel>
					<DisplayLabel label="Holding Duration">
						<div className="font-semibold">{formatDuration(holdingDuration)}</div>
					</DisplayLabel>
				</div>
			</AppCard>

			<AppCard className="p-4 flex flex-wrap items-center justify-between gap-4">
				<div className="text-text-secondary text-sm max-w-lg">
					Halve the holding duration recorded for WFPS. Anyone with 2% of FPS votes — directly or through supporters — can call
					this.
				</div>
				<GovernanceWfpsHalveAction />
			</AppCard>
		</>
	);
}
