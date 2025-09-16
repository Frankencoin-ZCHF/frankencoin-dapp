import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import Head from "next/head";
import { useEffect, useState } from "react";
import { RootState, store } from "../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount, useChainId } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import AppLink from "@components/AppLink";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import ReportsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";
import { useSelector } from "react-redux";
import { getChainByName } from "@utils";
import { useAppKitNetwork } from "@reown/appkit/react";
import { ChainId } from "@frankencoin/zchf";

export default function SavingsPage() {
	const activities = useSelector((state: RootState) => state.savings.savingsActivity);
	const { address } = useAccount();
	const router = useRouter();
	const AppKitNetwork = useAppKitNetwork();
	const chainId = useChainId() as ChainId;

	const queryAddress: Address = String(router.query.address).toLowerCase() as Address;
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	const queryChain: string = String(router.query.chain).toLowerCase();
	const [targetChainName, setTargetChainName] = useState("");

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchSavings(account == zeroAddress ? undefined : account));
	}, [account]);

	useEffect(() => {
		if (targetChainName.length > 0) return;

		let targetChainToCheck = queryChain.toLowerCase();

		if (targetChainToCheck == "optimism") {
			targetChainToCheck = "OP Mainnet";
		} else if (targetChainToCheck == "arbitrum") {
			targetChainToCheck = "Arbitrum One";
		}

		const targetChain = getChainByName(targetChainToCheck);

		if (targetChain.id != chainId) {
			AppKitNetwork.switchNetwork(targetChain);
		}

		setTargetChainName(targetChain.name);
	}, [chainId, queryChain, AppKitNetwork, targetChainName]);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title={`Savings`}>
				<div className={`text-text-secondary`}>
					Earn interest on your Frankencoins - now available across multiple chains. View and manage your account here. Get a
					glance over the latest changes via the{" "}
					<AppLink className="" label="transaction logs." href={"/monitoring/logs?kind=Savings"} external={false} />
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

			<AppTitle title="Yearly Accounts">
				<div className={`text-text-secondary`}>
					The yearly interest income of the current account. See also the
					<AppLink className="" label={" report page"} href={`/report`} />.
				</div>
			</AppTitle>
			<ReportsYearlyTable activity={activities} />

			<AppTitle title={account == undefined || account == zeroAddress ? "Recent Activities" : "Your latest Activities"} />

			<SavingsRecentActivitiesTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
function setError(arg0: string) {
	throw new Error("Function not implemented.");
}
