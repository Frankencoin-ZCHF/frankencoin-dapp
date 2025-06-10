import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import SavingsCollectInterest from "@components/PageSavings/SavingsCollectInterest";
import SavingsInteractionSection from "@components/PageSavings/SavingsInteractionSection";
import AppCard from "@components/AppCard";
import { TransactionHistoryPanel } from "@components/PageSavings/TransactionHistoryPanel";
import SavingsHistoryCard from "@components/PageSavings/SavingsHistoryCard";

export default function Savings() {
	const { t } = useTranslation();

	return (
		<>
			<Head>
				<title>dEURO - {t("savings.title")}</title>
			</Head>

			<div className="md:mt-8 flex justify-center">
				<div className="max-w-lg w-[32rem] flex flex-col gap-8">
					<AppCard className="w-full p-4 flex flex-col gap-8">
						<SavingsInteractionSection />
						<SavingsCollectInterest />
						<TransactionHistoryPanel />
					</AppCard>
					<SavingsHistoryCard />
				</div>
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
