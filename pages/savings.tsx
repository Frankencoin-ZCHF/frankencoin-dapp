import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import SavingsInterestTable from "@components/PageSavings/SavingsInterestTable";
import SavingsSavedTable from "@components/PageSavings/SavingsSavedTable";
import SavingsWithdrawnTable from "@components/PageSavings/SavingsWithdrawnTable";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../redux/redux.store";
import { fetchSavings } from "../redux/slices/savings.slice";
import { useAccount } from "wagmi";
import Link from "next/link";
import AppTitle from "@components/AppTitle";

export default function SavingsPage() {
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
	}, [address]);

	return (
		<>
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<AppTitle title="Savings">
			</AppTitle>

			<SavingsGlobalCard />

			<SavingsInteractionCard />

			<AppTitle title="Recent Deposits" />

			<SavingsSavedTable />

			<AppTitle title="Recent Interest Claims" />

			<SavingsInterestTable />

			<AppTitle title="Recent Withdrawals" />

			<SavingsWithdrawnTable />
		</>
	);
}
