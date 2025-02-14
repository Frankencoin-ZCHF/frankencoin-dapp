import Head from "next/head";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function Positions() {
	const { t } = useTranslation();

	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - {t("monitoring.title")}</title>
			</Head>

			<div className="md:mt-8">
				<h1 className="sm:hidden text-3xl font-black leading-9 tracking-tight mb-2 mt-4">{t("monitoring.title")}</h1>
				<MonitoringTable />
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