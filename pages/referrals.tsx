import Head from "next/head";
import { ReferralCenterSection } from "@components/PageReferrals/ReferralCenterSection";
import { FAQ } from "@components/PageReferrals/FAQ";
import YourReferralsTable from "@components/PageReferrals/YourReferralsTable";
import BonusHistoryTable from "@components/PageReferrals/BonusHistoryTable";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Referrals() {
	const { t } = useTranslation();

	return (
		<>
			<Head>
				<title>dEURO - {t("referrals.referrals")}</title>
			</Head>

			<div className="md:mt-8 flex flex-col gap-6 sm:gap-12">
				<ReferralCenterSection />
				<YourReferralsTable />
				<BonusHistoryTable />
				<FAQ />
			</div>
		</>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}