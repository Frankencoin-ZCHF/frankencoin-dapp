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
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function SavingsPage() {
	const { t } = useTranslation();
	const { address } = useAccount();

	useEffect(() => {
		store.dispatch(fetchSavings(address));
		// store.dispatch(fetchSavingsCoreInfo()); // TODO: Reactivate when API is ready
	}, [address]);

	return (
		<main className="section">
			<Head>
				<title>dEURO - {t("savings.title")}</title>
			</Head>

			<div className="mt-10">
				<span className="font-bold text-xl">{t("savings.title")}</span>
			</div>

			<div className="mt-8">{<SavingsGlobalCard />}</div>
			
			<div className="mt-8">
				<SavingsInteractionCard />
			</div>

			<div className="mt-10">
				<span className="font-bold text-xl">{t("savings.recent_deposits")}</span>
			</div>

			<div className="mt-8">{<SavingsSavedTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">{t("savings.recent_interest_claims")}</span>
			</div>

			<div className="mt-8">{<SavingsInterestTable />}</div>

			<div className="mt-10">
				<span className="font-bold text-xl">{t("savings.recent_withdrawals")}</span>
			</div>

			<div className="mt-8">{<SavingsWithdrawnTable />}</div>
		</main>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}