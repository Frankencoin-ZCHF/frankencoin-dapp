import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { normalizeAddress, SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchLeadrate } from "../../redux/slices/savings.slice";
import GovernanceMintersPropose from "@components/PageGovernance/GovernanceMintersPropose";
import GovernanceCCIPBridgesTable from "@components/PageGovernance/GovernanceCCIPBridgesTable";
import GovernanceCCIPAdminTable from "@components/PageGovernance/GovernanceCCIPAdminTable";
import GovernanceFloatingSharesChart from "@components/PageGovernance/GovernanceFloatingSharesChart";
import GovernanceFcsMilestoneSteps from "@components/PageGovernance/GovernanceFcsMilestoneSteps";
import { fetchBridge } from "../../redux/slices/bridge.slice";
import { useChainId } from "wagmi";
import { ADDRESS, ChainIdSide, ChainSide } from "@frankencoin/zchf";

const TOKENMANAGER_SLUGS: Record<number, string> = {
	1: "ethereum-mainnet",
	10: "optimism-mainnet",
	100: "gnosis-mainnet",
	137: "polygon-mainnet",
	146: "sonic-mainnet",
	8453: "base-mainnet",
	42161: "arbitrum-mainnet",
	43114: "avalanche-mainnet",
};

export default function Governance() {
	const chainId = useChainId();

	const tmSlug = TOKENMANAGER_SLUGS[chainId] ?? TOKENMANAGER_SLUGS[1];
	const tmToken = normalizeAddress(chainId === 1 ? ADDRESS[1].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin);
	const tokenmanagerHref = `https://tokenmanager.chain.link/dashboard/${tmSlug},${tmToken}`;

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchBridge());
	}, []);

	return (
		<>
			<Head>
				<title>Frankencoin - Governance</title>
			</Head>

			<AppTitle title="Governance">
				<div className="text-text-secondary">
					Frankencoin governance is veto-based rather than majority-vote: proposals (new collateral types, minting modules,
					interest rate changes, CCIP bridge changes) pass automatically after a grace period unless a qualified holder vetoes
					them. Voting power comes from two tokens —{" "}
					<AppLink className="inline" label="FPS (Frankencoin Pool Share)" href="/governance/fps" external={false} /> and{" "}
					<AppLink className="inline" label="FCS (Frankencoin Share)" href="/governance/fcs" external={false} />, which wraps FPS
					1:1 and pools its holders' votes into a single bloc with its own, lower qualification threshold. Follow either link to
					view rankings, delegate, or sync your votes across chains.
				</div>
			</AppTitle>

			<GovernanceFloatingSharesChart />

			<AppTitle title="Frankencoin Shares Milestones">
				<div className="text-text-secondary">
					As FPS holders wrap into FCS, it crosses thresholds that change what it can do on FPS's behalf — from veto power to full
					binding control. Here's where that migration currently stands.
				</div>
			</AppTitle>

			<GovernanceFcsMilestoneSteps />

			<AppTitle title="New Positions">
				<div className="text-text-secondary">
					Participants should carefully review newly proposed position types and deny them if they think they pose a risk to the
					stability of the Frankencoin. There is also a{" "}
					<AppLink
						label={"github forum"}
						href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions/categories/acceptable-collaterals?discussions_q=is%3Aopen+category%3A%22Acceptable+Collaterals%22"
						external={true}
						className="pr-2"
					/>
					{"and a "}
					<AppLink label={"telegram group"} href={SOCIAL.Telegram} external={true} className="pr-2" />
					to discuss eligible collaterals and their parameters.
				</div>
			</AppTitle>

			<GovernancePositionsTable />

			<AppTitle title="Interest Rates">
				<div className="text-text-secondary">
					Frankencoin has two key rates: the mint rate, applied when new coins are created, and the save rate, earned by savers on
					deposits. Anyone with veto power can propose a change, which can be applied if there is no counter-proposal within seven
					days.
				</div>
			</AppTitle>

			<GovernanceLeadrateCurrent />

			<GovernanceLeadrateTable />

			<AppTitle title="Minting Modules" />

			<GovernanceMintersPropose />

			<GovernanceMintersTable length={3} />

			<div className="flex justify-left">
				<AppLink className="text-left" label="See all modules" href="/governance/modules" external={false} />
			</div>

			<AppTitle title="CCIP Admin Proposals">
				<div className="text-text-secondary">
					Structural changes to the CCIP bridge — adding or removing chains, updating remote pool addresses, and transferring
					admin — require a governance proposal with a seven-day veto window (21 days for admin transfer). Any qualified FPS
					holder can deny a pending proposal before its deadline. Rate limit adjustments take effect immediately without a
					timelock.
				</div>
			</AppTitle>

			<GovernanceCCIPAdminTable />

			<AppTitle title="CCIP Bridges">
				<div className="text-text-secondary">
					Frankencoin is bridged between chains via{" "}
					<AppLink
						className="inline text-card-input-max hover:text-card-input-hover cursor-pointer"
						label="Chainlink CCIP"
						href={tokenmanagerHref}
						external={true}
					/>
					. Each source chain's token pool enforces its own incoming and outgoing rate limits per destination chain, so a transfer
					is throttled by the limits configured on both sides. When a limit is not enabled, transfers flow without throttling.
				</div>
			</AppTitle>

			<GovernanceCCIPBridgesTable />

			<div id="api-bot" className="scroll-mt-20">
				<AppTitle title="Notification Bot" />

				<GovernanceTelegramBot />
			</div>
		</>
	);
}
