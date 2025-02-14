import Head from "next/head";
import Link from "next/link";
import BorrowTable from "@components/PageBorrow/BorrowTable";
import { useEffect } from "react";
import { RootState, store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { useSelector } from "react-redux";
import BorrowForm from "@components/PageBorrow/BorrowForm";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function Borrow() {
	const expertMode = useSelector((state: RootState) => state.globalPreferences.expertMode);
	const { t } = useTranslation();

	useEffect(() => {
		store.dispatch(fetchPositionsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - {t('mint.title')}</title>
			</Head>

			{expertMode ? (
				<>
					<div className="md:mt-8">
						<h1 className="sm:hidden text-3xl font-black leading-9 tracking-tight mb-2 mt-4">{t('mint.title')}</h1>
						<BorrowTable />
					</div>

					<div className="flex">
						<Link href={"mint/create"} className="btn bg-layout-secondary font-bold text-layout-primary m-auto">
							{t('mint.propose_new_position')}
						</Link>
					</div>
				</>
			) : (
				<BorrowForm />
			)}
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