import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { formatCurrency, formatDuration, normalizeAddress, SOCIAL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchLeadrate } from "../../redux/slices/savings.slice";
import GovernanceMintersPropose from "@components/PageGovernance/GovernanceMintersPropose";
import GovernanceDelegation from "@components/PageGovernance/GovernanceDelegation";
import GovernanceCCIPBridgesTable from "@components/PageGovernance/GovernanceCCIPBridgesTable";
import GovernanceCCIPAdminTable from "@components/PageGovernance/GovernanceCCIPAdminTable";
import { useFPSAverageStats } from "@hooks";
import { formatUnits } from "viem";
import { fetchBridge } from "../../redux/slices/bridge.slice";
import { useConnection, useChainId } from "wagmi";
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
	const stats = useFPSAverageStats();
	const { address } = useConnection();
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

			<AppTitle title="Frankencoin Pool Share Holders">
				<div className="text-text-secondary">
					Voting power is proportional to both the number of FPS held as the holding duration. The average holding duration is{" "}
					<span className="font-medium text-text-primary">{formatDuration(stats.avgHoldingDuration)}</span>. Under these
					conditions, an individual FPS holder with at least{" "}
					<span className="font-medium text-text-primary">{formatCurrency(formatUnits(stats.fpsForVeto, 18))} FPS</span> held for
					the average duration would reach the veto threshold of 2%. If you need voting power on one of the supported multichains,
					sync your votes first. You can track cross-chain transfers on the{" "}
					<AppLink
						className=""
						label="CCIP Explorer"
						external={true}
						href={`https://ccip.chain.link${address ? `/address/${address}` : ""}`}
					/>
					.
				</div>
			</AppTitle>

			<GovernanceDelegation />

			<GovernanceVotersTable />

			<div id="api-bot" className="scroll-mt-20">
				<AppTitle title="Notification Bot" />

				<GovernanceTelegramBot />
			</div>
		</>
	);
}
