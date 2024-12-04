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

export default function SavingsPage() {
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
	}, [address]);

	return (
		<main className="section">
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<div className="mt-4">
				ℹ️ This savings module is deployed on mainnet and has been applied as a minter. You can track its governance proposal status
				on the{" "}
				<Link className="underline" href="/governance">
					governance page
				</Link>
				. Once the governance process completes without a veto, this savings module will be ready for use!
			</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Savings</span>
			</div>

			<div className="mt-8">
				<SavingsGlobalCard />
			</div>

			<div className="mt-8">
				<SavingsInteractionCard />
			</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Recent Deposits</span>
			</div>

			<div className="mt-8">{<SavingsSavedTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Recent Interest Claims</span>
			</div>

			<div className="mt-8">{<SavingsInterestTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Recent Withdrawals</span>
			</div>

			<div className="mt-8">{<SavingsWithdrawnTable />}</div>
		</main>
	);
}
