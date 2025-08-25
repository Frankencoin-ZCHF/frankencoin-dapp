import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import Head from "next/head";
import { useEffect, useState } from "react";
import { store } from "../redux/redux.store";
import { fetchLeadrate, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import AppLink from "@components/AppLink";
import SavingsRecentActivitiesTable from "@components/PageSavings/SavingsRecentActivitiesTable";
import { useRouter } from "next/router";
import { Address, isAddress, zeroAddress } from "viem";
import { ApiSavingsActivity } from "@frankencoin/api";
import { FRANKENCOIN_API_CLIENT } from "../app.config";
import ReportsYearlyTable from "@components/PageReports/ReportsSavingsYearlyTable";

export default function SavingsPage() {
	const [savings, setSavings] = useState<ApiSavingsActivity>([]);
	const { address } = useAccount();
	const router = useRouter();

	const queryAddress: Address = String(router.query.address).toLowerCase() as Address;
	const account = isAddress(queryAddress) ? queryAddress : address ?? zeroAddress;

	useEffect(() => {
		store.dispatch(fetchLeadrate());
		store.dispatch(fetchSavings(account));
	}, [account]);

	useEffect(() => {
		if (account.length == 0) {
			return;
		}

		if (!isAddress(account)) {
			setSavings([]);
			return;
		}

		const fetcher = async () => {
			try {
				const responseSavings = await FRANKENCOIN_API_CLIENT.get(`/savings/core/activity/${account}`);
				setSavings(responseSavings.data as ApiSavingsActivity);
			} catch (error) {
				console.log(error);
			}
		};

		fetcher();
	}, [account]);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title={`Savings`}>
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

			<AppTitle title="Yearly Accounts">
				<div className={`text-text-secondary`}>
					The yearly interest income of the current account. See also the
					<AppLink className="" label={" report page"} href={`/report`} />.
				</div>
			</AppTitle>
			<ReportsYearlyTable activity={savings} />

			<AppTitle title={account == undefined ? "Recent Activities" : "Your latest Activities"} />

			<SavingsRecentActivitiesTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
function setError(arg0: string) {
	throw new Error("Function not implemented.");
}
