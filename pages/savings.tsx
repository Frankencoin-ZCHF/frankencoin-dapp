import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount, useChainId } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import AppLink from "@components/AppLink";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { ChainId } from "@frankencoin/zchf";
import { getChain } from "@utils";
// import SavingsYearlyTable from "@components/PageSavings/SavingsYearlyTable";

export default function SavingsPage() {
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchSavings(address));
	}, [address]);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title={`Savings on ${chain.name}`}>
				<div className={`text-text-secondary`}>
					Earn interest on your Frankencoins - now available across multiple chains. View and manage your account here.
				</div>
			</AppTitle>

			<SavingsGlobalCard />

			<SavingsInteractionCard />

			<div className="text-text-secondary">
				Alternatively, you can also earn a yield by lending on
				<AppLink
					label={" Morpho"}
					href={"https://app.morpho.org/ethereum/earn?assetIdsFilter=ecc8bd13-eab5-4c7b-97e1-ba23d58f8cd3"}
					external={true}
					className=""
				/>
				.
			</div>

			{/* FIXME: Report deactivated */}

			{/* <AppTitle title="Yearly Accounts">
				<div className={`text-text-secondary`}>
					The yearly interest income of the current account. See also the
					<AppLink className="" label={" report page"} href={`/report`} />.
				</div>
			</AppTitle>
			<SavingsYearlyTable /> */}

			<AppTitle title={address == undefined ? "Recent Activities" : "Your latest Activities"} />

			<SavingsRecentActivitiesTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
