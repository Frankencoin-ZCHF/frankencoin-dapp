import { SecondaryButton } from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { useTranslation } from "next-i18next";
import { HeaderCell, LinkTitle, NoDataRow } from "./SectionTable";

const SavingsRow = () => {
	return (
		<>
			<div className="pr-3 flex items-center">
				<TokenLogo currency="dEURO" size={8} />
			</div>
			<span className="flex items-center text-text-primary text-base font-extrabold">12,300.00</span>
			<span className="flex items-center text-text-primary text-base font-medium">1,854.00</span>
			<span className="flex items-center text-text-primary text-base font-medium">615.00</span>
		</>
	);
};

export const MySavings = () => {
	const { t } = useTranslation();

	const savingsData = false;

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<LinkTitle href={"/savings"}>{t("dashboard.my_savings")}</LinkTitle>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_auto] gap-y-1">
					<span className="w-11 pr-3"></span>
					<HeaderCell>{t("dashboard.current_investment")}</HeaderCell>
					<HeaderCell>{t("dashboard.total_earned")}</HeaderCell>
					<HeaderCell>{t("dashboard.interest_to_be_collected")}</HeaderCell>
					{savingsData ? <SavingsRow /> : <NoDataRow className="col-span-3">{t("dashboard.no_savings_yet")}</NoDataRow>}
				</div>
			</div>
			{savingsData && (
				<div className="w-full flex-1 pt-10 flex items-end">
					<SecondaryButton className="w-full py-2.5 px-4">{t("dashboard.collect_interest")}</SecondaryButton>
				</div>
			)}
		</div>
	);
};
