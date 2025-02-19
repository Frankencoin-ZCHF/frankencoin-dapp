import Button, { SecondaryButton } from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { faArrowUpRightFromSquare, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import Link from "next/link";

export const MySavings = () => {
	const { t } = useTranslation();

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<Link href={'/savings'} className="pb-7 items-center justify-start flex gap-2">
				<span className="text-text-primary text-2xl font-black">{t("dashboard.my_savings")}</span>
				<FontAwesomeIcon icon={faArrowUpRightFromSquare} width={16} height={16} className="text-text-label" />
			</Link>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_auto] gap-y-1">
					<span></span>
					<span className="text-text-muted2 text-xs font-medium leading-[1.125rem]">{t("dashboard.current_investment")}</span>
					<span className="text-text-muted2 text-xs font-medium leading-[1.125rem]">{t("dashboard.total_earned")}</span>
					<span className="text-text-muted2 text-xs font-medium leading-[1.125rem]">
						{t("dashboard.interest_to_be_collected")}
					</span>
                    <div className="pr-3 flex items-center">
						<TokenLogo currency="dEURO" size={8} />
					</div>
					<span className="flex items-center text-text-primary text-base font-extrabold">12,300.00</span>
					<span className="flex items-center text-text-primary text-base font-medium">1,854.00</span>
					<span className="flex items-center text-text-primary text-base font-medium">615.00</span>
				</div>
			</div>
            <div className="w-full flex-1 pt-10 flex items-end">
				<SecondaryButton className="w-full py-2.5 px-4">
                    {t("dashboard.collect_interest")}
				</SecondaryButton>
            </div>
		</div>
	);
};
