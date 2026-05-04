import Head from "next/head";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useEquityTrades, useFPSBalanceHistory, useFPSEarningsHistory } from "@hooks";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import AppHeroSteps from "@components/AppHeroSteps";
import { AddressLabelSimple } from "@components/AddressLabel";
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
	const resolvedAddress: Address = isAddress(queryAddress) ? queryAddress : address || zeroAddress;

	const fpsHistory = useFPSBalanceHistory(resolvedAddress);
	const fpsEarnings = useFPSEarningsHistory(resolvedAddress);
	const equityTrades = useEquityTrades(resolvedAddress);

	return (
		<>
			<Head>
				<title>Frankencoin - Invest</title>
			</Head>

			<AppTitle title="Invest">
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
					<EquityFPSDetailsCard equityTrades={equityTrades} />
				</section>
			</div>

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
			<ReportsFPSYearlyTable address={resolvedAddress} fpsHistory={fpsHistory} fpsEarnings={fpsEarnings} />

			<AppTitle title={isQueryOverride ? "Trades" : "My Trades"}>
				<div className="text-text-secondary">
					{isQueryOverride
						? "FPS investments and redemptions for this address."
						: "A history of your personal FPS investments and redemptions."}{" "}
					Each trade incurs a 0.3% fee on behalf of the reserve.
				</div>
			</AppTitle>
			<EquityTradesTable trades={equityTrades} />
		</>
	);
}
