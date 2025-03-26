import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import Head from "next/head";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function ChallengesPage() {
	const { t } = useTranslation();

	useEffect(() => {
		store.dispatch(fetchChallengesList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - {t("challenges.title")}</title>
			</Head>

			<div className="md:mt-8">
				<h1 className="sm:hidden text-3xl font-black leading-9 tracking-tight mb-2 mt-4">{t("challenges.title")}</h1>
				<ChallengesTable />
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