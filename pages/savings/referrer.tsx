import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import SavingsReferrerTable from "@components/PageSavings/SavingsReferrerTable";

export default function SavingsReferrerPage() {
	return (
		<>
			<Head>
				<title>Frankencoin - Savings Referrals</title>
			</Head>

			<AppTitle title="Savings Referrals">
				<div className="text-text-secondary">
					Balances of ZCHF savers grouped by the referrer that referred them. See also the{" "}
					<AppLink className="" label="Earn page" href={`/savings`} />.
				</div>
			</AppTitle>

			<div className="mt-8">
				<SavingsReferrerTable />
			</div>
		</>
	);
}
