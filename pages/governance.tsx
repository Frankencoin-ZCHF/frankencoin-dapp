import Head from "next/head";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { SOCIAL, TOKEN_SYMBOL } from "@utils";
import GovernanceLeadrateTable from "@components/PageGovernance/GovernanceLeadrateTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Trans, useTranslation } from "next-i18next";

const StyledLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
	<a target="_blank" href={href}>
		<span className="font-bold underline">{children}</span>
	</a>
);

export default function Governance() {
	const { t } = useTranslation();

	return (
		<>
			<Head>
				<title>dEURO - {t("governance.title")}</title>
			</Head>

			<div className="md:mt-10">
				<span className="font-bold text-xl">{t("governance.new_positions")}</span>
			</div>

			<div className="">
				<Trans i18nKey="governance.new_positions_description">
					<StyledLink href={SOCIAL.Github_contract_discussion}>github forum</StyledLink>
					<StyledLink href={SOCIAL.Telegram}>telegram group</StyledLink>
				</Trans>
			</div>

			<div className="md:mt-8">
				<GovernancePositionsTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">{t("governance.base_rate")}</span>
			</div>

			<div className="">{t("governance.base_rate_description", { symbol: TOKEN_SYMBOL })}</div>

			<div className="md:mt-8">
				<GovernanceLeadrateCurrent />
			</div>

			<div className="md:mt-8">
				<GovernanceLeadrateTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">{t("governance.minting_modules")}</span>
			</div>

			<div className="md:mt-8">
				<GovernanceMintersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">{t("governance.native_deuro_pool_share_holders")}</span>
			</div>

			<div className="md:mt-8">
				<GovernanceVotersTable />
			</div>

			<div className="md:mt-10">
				<span className="font-bold text-xl">{t("governance.d_euro_api_bot")}</span>
			</div>

			<div className="md:mt-8">
				<GovernanceTelegramBot />
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
