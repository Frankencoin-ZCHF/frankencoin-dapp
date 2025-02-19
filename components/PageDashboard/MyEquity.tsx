import Button from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import Link from "next/link";

export const MyEquity = () => {
	const { t } = useTranslation();

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<Link href={'/equity'} className="pb-7 items-center justify-start flex gap-2">
				<span className="text-text-primary text-2xl font-black">{t("dashboard.my_equity")}</span>
				<FontAwesomeIcon icon={faArrowUpRightFromSquare} width={16} height={16} className="text-text-label" />
			</Link>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]">
                    {/** Headers */}
					<span></span>
					<span className="text-text-muted2 text-xs font-medium leading-[1.125rem]">{t("dashboard.current_investment")}</span>
					<span className="text-text-muted2 text-xs font-medium leading-[1.125rem] text-right">
						{t("dashboard.symbol_amount", { symbol: "dEURO" })}
					</span>
                    {/** DEPS */}
					<div className="flex items-center py-2">
						<span className="flex items-center pr-2">
							<TokenLogo currency="DEPS" size={8} />
						</span>
						<span className="w-16 text-text-primary text-base font-extrabold">DEPS</span>
					</div>
					<span className="flex items-center text-text-primary text-base font-medium">12,300.00</span>
					<span className="flex items-center justify-end text-text-primary text-base font-medium">1,854.00</span>
                    {/** nDEPS */}
					<div className="flex items-center py-2">
						<span className="flex items-center pr-2">
							<TokenLogo currency="nDEPS" size={8} />
						</span>
						<span className="w-16 text-text-primary text-base font-extrabold">nDEPS</span>
					</div>
					<span className="flex items-center text-text-primary text-base font-medium">12,300.00</span>
					<span className="flex items-center justify-end text-text-primary text-base font-medium">1,854.00</span>
				</div>
			</div>
			<div className="w-full pt-5 flex-1 flex items-end">
				<div className="flex flex-row justify-between items-center w-full">
					<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">{t("dashboard.total_invested")}</span>
					<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">12,300.00</span>
				</div>
			</div>
		</div>
	);
};
