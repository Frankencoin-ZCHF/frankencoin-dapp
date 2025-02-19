import TokenLogo from "@components/TokenLogo";
import { Button } from "flowbite-react";
import { useTranslation } from "next-i18next";
import { Fragment } from "react";

const mockData = [
	{
		collateral: "WETH",
		collateralAmount: "4.811",
		collateralization: "100%",
		loanDueIn: "1021 days",
		amountBorrowed: "10.000 dEURO",
	},
	{
		collateral: "WBTC",
		collateralAmount: "0.12951",
		collateralization: "100%",
		loanDueIn: "1021 days",
		amountBorrowed: "10.000 dEURO",
	},
];

export const MyBorrow = () => {
	const { t } = useTranslation();

	return (
		<div className="w-full h-full p-8 flex flex-col items-start">
			<div className="pb-7 items-center justify-start flex gap-2">
				<span className="text-text-primary text-2xl font-black">{t("dashboard.my_borrow")}</span>
			</div>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center">
					{/** Headers */}
					<div></div>
					<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateral</div>
					<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateralization</div>
					<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Loan due in</div>
					<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Amount borrowed</div>
					<div className="text-center"></div>

					{/** Rows */}
					{mockData.map((item) => (
						<Fragment key={item.collateral}>
							<div className="flex py-3 pr-3 items-center justify-center">
								<TokenLogo currency={item.collateral} size={8} />
							</div>
							<div className="py-3 font-medium text-base leading-tight">{item.collateralAmount} {item.collateral}</div>
							<div className="py-3 font-medium text-base leading-tight">{item.collateralization}</div>
							<div className="py-3 font-medium text-base leading-tight">{item.loanDueIn}</div>
							<div className="py-3 font-extrabold text-base leading-tight">{item.amountBorrowed}</div>
							<div className="py-3 flex items-center justify-end">
								<Button
									className="min-w-32 w-full !py-1 !px-4 border-none leading-[1.5rem] !text-base font-extrabold text-text-tertiary !bg-[#F5F6F9] focus:ring-0"
									size="sm"
								>
									{t("dashboard.manage")}
								</Button>
							</div>
						</Fragment>
					))}
				</div>
			</div>
			<div className="w-full pt-5 flex-1 flex items-end">
				<div className="flex flex-row items-center w-full">
					<span className="text-text-primary pr-4 text-base font-extrabold leading-[1.25rem]">
						{t("dashboard.total_owed")}
					</span>
					<span className="text-text-primary text-base font-medium leading-[1.25rem]">12,300.00 dEURO</span>
				</div>
			</div>
		</div>
	);
};
