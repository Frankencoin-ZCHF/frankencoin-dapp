import React from "react";
import Head from "next/head";
import EquityNativePoolShareDetailsCard from "@components/PageEquity/EquityNativePoolShareDetailsCard";
import EquityInteractionCard from "@components/PageEquity/EquityInteractionCard";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function Equity() {
	const { t } = useTranslation();
	
	return (
		<>
			<Head>
				<title>dEURO - {t("equity.title")}</title>
			</Head>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
					<EquityInteractionCard />
					<EquityNativePoolShareDetailsCard />
				</section>
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