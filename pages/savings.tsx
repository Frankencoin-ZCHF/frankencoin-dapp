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
				<div className="text-text-secondary">
					ℹ️ This module has been deployed on 2024-11-27 and is going through a 14 days the{" "}
					<Link className="underline" href="/governance">
						approval process
					</Link>
					. Once the 14 days have passed without anyone casting a veto, the savings module will be ready for use.
				</div>
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
