import Head from "next/head";
import { StartEarningSection } from "@components/PageReferrals/StartEarningSection";
import { ReferralCenterSection } from "@components/PageReferrals/ReferralCenterSection";
import { FAQ } from "@components/PageReferrals/FAQ";

export default function Referrals() {
	return (
		<main className="container-xl mx-auto">
			<Head>
				<title>dEURO - Referrals</title>
			</Head>

			<div className="md:mt-10 flex flex-col gap-12">
				<StartEarningSection />
				<ReferralCenterSection />
				<FAQ />
			</div>
		</main>
	);
}
