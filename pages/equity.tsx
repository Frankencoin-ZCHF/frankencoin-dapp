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
					Invest in or redeem{" "}
					<AppLink className="" label="Frankencoin Shares (FCS)" href="/governance/fcs" external={false} />{" "}
					— the equity and governance token of the Frankencoin Ecosystem — to earn a share of protocol income and vote
					with a lower veto threshold.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Get FCS",
						description: "Deposit ZCHF to receive newly minted FCS and become an equity holder in the Frankencoin Ecosystem.",
					},
					{
						icon: 2,
						title: "Participate",
						description:
							"FCS is backed 1:1 by the pooled reserve, so its value climbs (or falls) with Frankencoin's success (or decline).",
					},
					{
						icon: 3,
						title: "Govern",
						description:
							"Team up with other FCS holders to veto protocol extensions or collaterals you don't like, with a lower 1% threshold.",
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
