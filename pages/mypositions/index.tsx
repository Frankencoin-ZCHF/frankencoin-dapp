import Head from "next/head";
import MypositionsTable from "@components/PageMypositions/MypositionsTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { useRouter } from "next/router";
import { Address } from "viem";
import { shortenAddress } from "@utils";
import { useEffect } from "react";
import { store } from "../../redux/redux.store";
import { fetchPositionsList } from "../../redux/slices/positions.slice";
import { fetchChallengesList } from "../../redux/slices/challenges.slice";
import { fetchBidsList } from "../../redux/slices/bids.slice";
import { SectionTitle } from "@components/SectionTitle";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function Positions() {
	const router = useRouter();
	const overwrite: Address = router.query.address as Address;
	const { t } = useTranslation();

	useEffect(() => {
		store.dispatch(fetchPositionsList());
		store.dispatch(fetchChallengesList());
		store.dispatch(fetchBidsList());
	}, []);

	return (
		<>
			<Head>
				<title>dEURO - {t("my_positions.positions")}</title>
			</Head>

			{/* Section Positions */}
			<div className="md:mt-8">
				<div>
					<SectionTitle>{t("my_positions.owned_positions")}</SectionTitle>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MypositionsTable />
				</div>

				<div className="mt-8 sm:mt-12">
					<SectionTitle>{t("my_positions.initiated_challenges")}</SectionTitle>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MyPositionsChallengesTable />
				</div>

				{/* Section Bids */}
				<div className="mt-8 sm:mt-12">
					<SectionTitle>{t("my_positions.initiated_bids")}</SectionTitle>
					<DisplayWarningMessage overwrite={overwrite} />
				</div>

				<div className="">
					<MyPositionsBidsTable />
				</div>
			</div>
		</>
	);
}

function DisplayWarningMessage(props: { overwrite: Address }) {
	const { t } = useTranslation();
	return (
		<div>
			<span className="font-bold text-sm">{props.overwrite ? `(${t("my_positions.public_view_for")}: ${shortenAddress(props.overwrite)})` : ""}</span>
		</div>
	);
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}