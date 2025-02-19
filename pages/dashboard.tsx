import Head from "next/head";
import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { MyInvestmentSection } from "@components/PageDashboard/MyInvestmentSection";
import { MySavings } from "@components/PageDashboard/MySavings";
import { MyEquity } from "@components/PageDashboard/MyEquity";
import { MyBorrow } from "@components/PageDashboard/MyBorrow";
import MonitoringTable from "@components/PageMonitoring/MonitoringTable";
import MyPositionsChallengesTable from "@components/PageMypositions/MyPositionsChallengesTable";
import { Tabs } from "@components/Tabs";
import ChallengesTable from "@components/PageChallenges/ChallengesTable";
import MyPositionsBidsTable from "@components/PageMypositions/MyPositionsBidsTable";
import { TOKEN_SYMBOL } from "@utils";
import { SOCIAL } from "@utils";
import GovernancePositionsTable from "@components/PageGovernance/GovernancePositionsTable";
import GovernanceLeadrateCurrent from "@components/PageGovernance/GovernanceLeadrateCurrent";
import GovernanceLeadrateTable from "@components/PageSavings/SavingsSavedTable";
import GovernanceMintersTable from "@components/PageGovernance/GovernanceMintersTable";
import GovernanceVotersTable from "@components/PageGovernance/GovernanceVotersTable";
import GovernanceTelegramBot from "@components/PageGovernance/GovernanceTelegramBot";
import { SectionTitle } from "@components/SectionTitle";
import { ExpertModeToogle } from "@components/ExpertModeToogle";
import { useSelector } from "react-redux";
import { RootState } from "../redux/redux.store";

const StyledLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
	<a target="_blank" href={href}>
		<span className="underline">{children}</span>
	</a>
);

export default function Dashboard() {
	const { t } = useTranslation();
	const expertMode = useSelector((state: RootState) => state.globalPreferences.expertMode);

	return (
		<>
			<Head>
				<title>dEURO - {t("dashboard.title")}</title>
			</Head>

			<div className="md:mt-8 flex flex-col gap-6 sm:gap-[3.75rem]">
				<div className="w-full self-stretch flex-col rounded-xl justify-start items-center inline-flex shadow-card">
					<div className="w-full bg-white rounded-xl flex-col justify-start items-start flex overflow-hidden">
						<MyInvestmentSection />
						<div className="w-full flex flex-col sm:flex-row justify-between items-stretch">
							<div className="flex-1 sm:w-1/2 border-b sm:border-r sm:border-b-0 sm:border-borders-dividerLight">
								<MySavings />
							</div>
							<div className="flex-1 sm:w-1/2 border-b sm:border-r sm:border-b-0 sm:border-borders-dividerLight">
								<MyEquity />
							</div>
						</div>
						<div className="w-full flex justify-between items-center border-t border-borders-dividerLight">
							<MyBorrow />
						</div>
					</div>
				</div>

				<div className="w-full self-stretch flex-col gap-6 sm:gap-4">
					<Tabs
						tabs={[
							{
								id: "monitoring",
								label: t("monitoring.title"),
								content: <MonitoringTable />,
							},
							{
								id: "challenges",
								label: t("my_positions.initiated_challenges"),
								content: <MyPositionsChallengesTable />,
							},
						]}
					/>
				</div>

				<div className="w-full self-stretch flex-col gap-6 sm:gap-4">
					<Tabs
						tabs={[
							{
								id: "challenges",
								label: t("challenges.title"),
								content: <ChallengesTable />,
							},
							{
								id: "bids",
								label: t("dashboard.bought_through_bids"),
								content: <MyPositionsBidsTable />,
							},
						]}
					/>
				</div>

				<div>
					<div className="pt-5 border-b border-[#DFE0E6]" />
					<div className="pb-5" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex flex-row items-center gap-5">
						<SectionTitle className="!mb-0">{t("governance.governance")}</SectionTitle>
						<div className="flex border-r border-[#DFE0E6] h-[1.5rem]" />
						<ExpertModeToogle />
					</div>
					<p className="text-base leading-tight font-medium text-text-muted2">{t("dashboard.governance_description")}</p>
				</div>
				{expertMode ? (
					<>
						<div className="flex flex-col gap-5">
							<div>
								<SectionTitle className="!mb-1">{t("governance.new_positions")}</SectionTitle>
								<p className="text-base leading-tight font-medium text-text-muted2">
									<Trans i18nKey="dashboard.governance_description_2">
										<StyledLink href={SOCIAL.Github_contract_discussion}>{""}</StyledLink>
									</Trans>
								</p>
							</div>
							<GovernancePositionsTable />
						</div>

						<div className="flex flex-col gap-5">
							<div>
								<SectionTitle className="!mb-1">{t("governance.base_rate")}</SectionTitle>
								<p className="text-base leading-tight font-medium text-text-muted2">
									{t("governance.base_rate_description", { symbol: TOKEN_SYMBOL })}
								</p>
							</div>
							<GovernanceLeadrateCurrent />
							<GovernanceLeadrateTable />
						</div>

						<div className="flex flex-col gap-4">
							<SectionTitle className="!mb-1">{t("governance.minting_modules")}</SectionTitle>
							<GovernanceMintersTable />
						</div>

						<div className="flex flex-col gap-4">
							<SectionTitle className="!mb-1">{t("dashboard.dEURO_Protocol_Share_Holders_nDEPS_and_DEPS")}</SectionTitle>
							<GovernanceVotersTable />
						</div>
					</>
				) : null}
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
