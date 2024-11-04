import SavingsGlobalCard from "@components/PageSavings/SavingsGlobalCard";
import SavingsInteractionCard from "@components/PageSavings/SavingsInteractionCard";
import SavingsInterestTable from "@components/PageSavings/SavingsInterestTable";
import SavingsSavedTable from "@components/PageSavings/SavingsSavedTable";
import SavingsWithdrawnTable from "@components/PageSavings/SavingsWithdrawnTable";
import Head from "next/head";

export default function SavingsPage() {
	return (
		<main className="section">
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<div className="mt-10">
				<span className="font-bold text-xl">Savings Statistics</span>
			</div>

			<div className="mt-8">{<SavingsGlobalCard />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Earn some Interest</span>
			</div>

			<div className="mt-8">
				<SavingsInteractionCard />
			</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Latest Saved</span>
			</div>

			<div className="mt-8">{<SavingsSavedTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Latest Interest Claimed</span>
			</div>

			<div className="mt-8">{<SavingsInterestTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">Latest Withdrawn</span>
			</div>

			<div className="mt-8">{<SavingsWithdrawnTable />}</div>
		</main>
	);
}
