import React from "react";
import Head from "next/head";
import EquityFPSDetailsCard from "@components/PageEquity/EquityFPSDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import AppTitle from "@components/AppTitle";
import { useAccount } from "wagmi";
import { useFPSBalanceHistory, useFPSEarningsHistory } from "@hooks";
import ReportsFPSYearlyTable from "@components/PageReports/ReportsFPSYearlyTable";
import { zeroAddress } from "viem";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";
import { ContractUrl } from "@utils";
import { ADDRESS } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function Equity() {
	const { address } = useAccount();
	const fpsHistory = useFPSBalanceHistory(address || zeroAddress);
	const fpsEarnings = useFPSEarningsHistory(address || zeroAddress);

	return (
		<>
			<Head>
				<title>Frankencoin - Invest</title>
			</Head>

			<AppTitle title={`Invest`}>
				<div className="text-text-secondary">
					Invest in or redeem your{" "}
					<AppLink className="" label="Frankencoin Pool Shares" href={ContractUrl(ADDRESS[mainnet.id].equity)} external={true} />{" "}
					(FPS) — the governance token of the Frankencoin Ecosystem.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: 1,
						title: "Get Pool Shares",
						description: "Add ZCHF to the Frankencoin reserve pool and get newly minted pool shares in return.",
					},
					{
						icon: 2,
						title: "Participate",
						description: "FPS's fundamental value climbs (or falls) with Frankencoin's success (or decline).",
					},
					{
						icon: 3,
						title: "Govern",
						description: "Team up with others to veto protocol extensions or collaterals you don't like.",
					},
				]}
			/>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
					<EquityInteractionCard />
					<EquityFPSDetailsCard />
				</section>
			</div>

			<AppTitle title="Attributable Income">
				<div className="text-text-secondary">
					Historic system income <AppLink className="text-left" label={"attributable to the current address"} href={`/report`} />.
				</div>
			</AppTitle>
			<ReportsFPSYearlyTable address={address || zeroAddress} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />
		</>
	);
}
