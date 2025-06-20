import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { SectionTitle } from "@components/SectionTitle";
import { GroupButtons } from "@components/GroupButtons";
import { useRouter } from "next/router";
import { CollateralManageSection } from "@components/PageMint/CollateralManageSection";
import { BorrowedManageSection } from "@components/PageMint/BorrowedManageSection";
import { ExpirationManageSection } from "@components/PageMint/ExpirationManageSection";
import { PriceManageSection } from "@components/PageMint/PriceManageSection";
import { toQueryString } from "@utils";
import { getCarryOnQueryParams } from "@utils";
import AppCard from "@components/AppCard";

enum Tab {
	Collateral = "collateral",
	Borrowed = "borrowed",
	Expiration = "expiration",
	Price = "price",
}

const renderContent = (tab: Tab) => {
	switch (tab) {
		case Tab.Collateral:
			return <CollateralManageSection />;
		case Tab.Borrowed:
			return <BorrowedManageSection />;
		case Tab.Expiration:
			return <ExpirationManageSection />;
		case Tab.Price:
			return <PriceManageSection />;
		default:
			return null;
	}
};

export default function PositionManage() {
	const router = useRouter();
	const { address, tab } = router.query;
	const [activeButton, setActiveButton] = useState("");
	const carryOnQueryParams = getCarryOnQueryParams(router);
	const { t } = useTranslation();

	const tabs = useMemo(
		() => [
			{
				id: Tab.Collateral,
				label: t("mint.collateral"),
			},
			{
				id: Tab.Borrowed,
				label: t("mint.borrowed"),
			},
			{
				id: Tab.Expiration,
				label: t("mint.expiration"),
			},
			{
				id: Tab.Price,
				label: t("mint.price"),
			},
		],
		[t]
	);

	useEffect(() => {
		if (router.isReady) {
			setActiveButton((tab as Tab) || Tab.Collateral);
		}
	}, [router.isReady, tab]);

	const handleClick = (id: string) => {
		setActiveButton(id);
		router.replace(`/mint/${address}/manage/${id}${toQueryString(carryOnQueryParams)}`);
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("my_positions.manage_position")}</title>
			</Head>
			<div className="md:mt-8 flex justify-center">
				<AppCard className="max-w-lg sm:min-w-[32rem] p-4 flex flex-col gap-y-8">
					<SectionTitle className="!mb-0 text-center !text-xl">{t("mint.adjust_your_borrowing_position")}</SectionTitle>
					<div className="flex flex-col gap-y-7">
						<GroupButtons buttons={tabs} setActiveButton={handleClick} activeButton={activeButton} />
						<div className="w-full">{renderContent(activeButton as Tab)}</div>
					</div>
				</AppCard>
			</div>
		</>
	);
}

export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}
