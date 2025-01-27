import Head from "next/head";
import { ReferralCenterSection } from "@components/PageReferrals/ReferralCenterSection";
import { FAQ } from "@components/PageReferrals/FAQ";
import YourReferralsTable from "@components/PageReferrals/YourReferralsTable";
import BonusHistoryTable from "@components/PageReferrals/BonusHistoryTable";

export default function Referrals() {
	return (
		<>
			<Head>
				<title>dEURO - Referrals</title>
			</Head>

			<div className="md:mt-8 flex flex-col gap-6 sm:gap-12">
				<ReferralCenterSection />
				<YourReferralsTable
					data={Array(10).fill({
						volume: "256.12",
						date: "22 Jan 2025",
						address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
					})}
				/>
				<BonusHistoryTable
					data={Array(10).fill({
						payout: "256.12",
						source: "Minting",
						date: "22 Jan 2025",
						txId: "0x880d1ab3ee32e6a721312677abdada4bf9e0e40961e16af297932e12dadae3c5",
					})}
				/>
				<FAQ />
			</div>
		</>
	);
}
