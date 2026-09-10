import Head from "next/head";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useEquityTrades, useFPSYearlyReport } from "@hooks";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import EquityTradesTable from "@components/PageEquity/EquityTradesTable";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import { ContractUrl } from "@utils";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function Equity() {
	const { address } = useConnection();
	const router = useRouter();
	const queryAddress = router.query.address as Address;
	const isQueryOverride = isAddress(queryAddress) && queryAddress.toLowerCase() !== address?.toLowerCase();
	const hasAddress = !!address || isAddress(queryAddress);
	const resolvedAddress: Address = isAddress(queryAddress) ? queryAddress : address || zeroAddress;

	const fpsYearlyReport = useFPSYearlyReport(resolvedAddress);
	const equityTrades = useEquityTrades(resolvedAddress);
	// FPS Price chart annotations only make sense against pure FPS1 invest/redeem trades.
	const fpsTrades = equityTrades.filter((t) => t.kind === "Invested" || t.kind === "Redeemed");

	return (
		<>
			<Head>
				<title>Frankencoin - Invest</title>
			</Head>

			<AppTitle title="Invest">
				<div className="text-text-secondary">
					Invest in or redeem your{" "}
					<AppLink
						className=""
						label="Frankencoin Pool Shares (FPS)"
						href={ContractUrl(ADDRESS[mainnet.id].equity)}
						external={true}
					/>{" "}
					— the governance token of the Frankencoin Ecosystem — or wrap into{" "}
					<AppLink className="" label="Frankencoin Shares (FCS)" href={ContractUrl(ADDRESS[mainnet.id].fcs)} external={true} />{" "}
					for pooled governance power and a lower veto threshold.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Get Pool Shares",
						description:
							"Add ZCHF to the Frankencoin reserve pool for newly minted FPS, or deposit straight into FCS — or wrap existing FPS into FCS at any time.",
					},
					{
						icon: 2,
						title: "Participate",
						description:
							"FCS wraps FPS 1:1, so both share the same fundamental value, climbing (or falling) with Frankencoin's success (or decline).",
					},
					{
						icon: 3,
						title: "Govern",
						description:
							"Team up with others to veto protocol extensions or collaterals you don't like — FCS holders get a lower 1% threshold instead of FPS's 2%.",
					},
				]}
			/>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
					<EquityInteractionCard />
					<EquityFPSDetailsCard equityTrades={fpsTrades} />
				</section>
			</div>

			{hasAddress && (
				<>
					<AppTitle title="Attributable Income">
						<div className="text-text-secondary">
							Historic system income{" "}
							<AppLink
								className=""
								label={isQueryOverride ? "attributable to this address" : "attributable to the current address"}
								href={`/report${isQueryOverride ? `?address=${resolvedAddress}` : ""}`}
							/>
							.
						</div>
					</AppTitle>
					<ReportsFPSYearlyTable address={resolvedAddress} rows={fpsYearlyReport} />

					<AppTitle title={isQueryOverride ? "Trades" : "My Trades"}>
						<div className="text-text-secondary">Investment and redemption history.</div>
					</AppTitle>
					<EquityTradesTable trades={equityTrades} />
				</>
			)}
		</>
	);
}
