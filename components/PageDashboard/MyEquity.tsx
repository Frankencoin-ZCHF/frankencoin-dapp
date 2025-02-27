import TokenLogo from "@components/TokenLogo";
import { useTranslation } from "next-i18next";
import { HeaderCell, LinkTitle, NoDataRow } from "./SectionTable";

const EquityRow = ({ symbol, currentInvestment, amount }: { symbol: string; currentInvestment: string; amount: string }) => {
	return (
		<>
			<div className="flex items-center py-2">
				<span className="flex items-center pr-2">
					<TokenLogo currency={symbol} size={8} />
				</span>
				<span className="w-16 text-text-primary text-base font-extrabold">{symbol}</span>
			</div>
			<span className="flex items-center text-text-primary text-base font-medium">{currentInvestment}</span>
			<span className="flex items-center justify-end text-text-primary text-base font-medium">{amount}</span>
		</>
	);
};

export const MyEquity = () => {
	const { t } = useTranslation();

	const equityData = [
		{ symbol: "DEPS", currentInvestment: "12,300.00", amount: "1,854.00" },
		{ symbol: "nDEPS", currentInvestment: "12,300.00", amount: "1,854.00" },
	];

	const isEquityData = false && equityData.length > 0;

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<LinkTitle href={"/equity"}>{t("dashboard.my_equity")}</LinkTitle>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]">
					{/** Headers */}
					<span></span>
					<HeaderCell>{t("dashboard.current_investment")}</HeaderCell>
					<HeaderCell className="text-right">{t("dashboard.symbol_amount", { symbol: "dEURO" })}</HeaderCell>
					{isEquityData ? (
						equityData.map((item) => <EquityRow key={item.symbol} {...item} />)
					) : (
						<NoDataRow className="col-span-2">{t("dashboard.no_investments_yet")}</NoDataRow>
					)}
				</div>
			</div>
			{isEquityData && (
				<div className="w-full pt-5 flex-1 flex items-end">
					<div className="flex flex-row justify-between items-center w-full">
						<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">
							{t("dashboard.total_invested")}
						</span>
						<span className="text-text-primary text-base font-extrabold leading-[1.25rem]">12,300.00</span>
					</div>
				</div>
			)}
		</div>
	);
};
