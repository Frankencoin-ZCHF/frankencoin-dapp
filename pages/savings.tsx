import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import SavingsInterestTable from "@components/PageSavings/SavingsInterestTable";
import SavingsSavedTable from "@components/PageSavings/SavingsSavedTable";
import SavingsWithdrawnTable from "@components/PageSavings/SavingsWithdrawnTable";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchBalance, fetchSavings } from "../redux/slices/savings.slice";
import { useAccount } from "wagmi";
import AppTitle from "@components/AppTitle";
import SavingsRankedBalancesTable from "@components/PageSavings/SavingsRankedBalancesTable";
import { useContractUrl } from "@hooks";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../app.config";
import AppLink from "@components/AppLink";
import SavingsYearlyTable from "@components/PageSavings/SavingsYearlyTable";

export default function SavingsPage() {
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
		store.dispatch(fetchBalance());
	}, [address]);

	const savings = ADDRESS[WAGMI_CHAIN.id].savings;
	const link = useContractUrl(savings);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title={`Savings `}></AppTitle>

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

			<AppTitle title="Yearly Accounts" />

			<SavingsYearlyTable />

			<AppTitle title="Recent Deposits" />

			<SavingsSavedTable />

			<AppTitle title="Recent Interest Claims" />

			<SavingsInterestTable />

			<AppTitle title="Recent Withdrawals" />

			<SavingsWithdrawnTable />

			<AppTitle title="Top Saver's Accounts" />

			<SavingsRankedBalancesTable />
		</>
	);
}
