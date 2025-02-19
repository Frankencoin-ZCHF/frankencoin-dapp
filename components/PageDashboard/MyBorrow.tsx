import { SecondaryButton } from "@components/Button";
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
interface BorrowData {
	collateral: string;
	collateralAmount: string;
	collateralization: string;
	loanDueIn: string;
	amountBorrowed: string;
}

const DesktopTable = ({ borrowData }: { borrowData: BorrowData[] }) => {
	const { t } = useTranslation();

	return (
		<div className="w-full hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center">
			{/** Headers */}
			<div></div>
			<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateral</div>
			<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateralization</div>
			<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Loan due in</div>
			<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Amount borrowed</div>
			<div className="text-center"></div>

			{/** Rows */}
			{borrowData.map((item) => (
				<Fragment key={item.collateral}>
					<div className="flex pr-3 items-center justify-center">
						<TokenLogo currency={item.collateral} size={8} />
					</div>
					<div className="font-medium text-base leading-tight">
						{item.collateralAmount} {item.collateral}
					</div>
					<div className="font-medium text-base leading-tight">{item.collateralization}</div>
					<div className="font-medium text-base leading-tight">{item.loanDueIn}</div>
					<div className="font-extrabold text-base leading-tight">{item.amountBorrowed}</div>
					<div className="py-3 flex items-center justify-end">
						<SecondaryButton className="flex min-w-32 w-full py-2.5 px-4">{t("dashboard.manage")}</SecondaryButton>
					</div>
				</Fragment>
			))}
		</div>
	);
};

const MobileTable = ({ borrowData }: { borrowData: BorrowData[] }) => {
	const { t } = useTranslation();

	return (
		<div className="block sm:hidden w-full flex flex-col items-center gap-6">
			{borrowData.map((item) => (
				<div className="w-full flex flex-col gap-1 border-b border-borders-dividerLight" key={item.collateral}>
					<div className="mb-2 w-full flex flex-col justify-start items-start gap-1">
						<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateral</div>
						<div className="flex flex-row items-center gap-2">
							<div className="flex items-center justify-center">
								<TokenLogo currency={item.collateral} size={8} />
							</div>
							<div className="font-medium text-base leading-tight">
								{item.collateralAmount} {item.collateral}
							</div>
						</div>
					</div>

					<div className="w-full flex flex-row justify-between items-center">
						<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Collateralization</div>
						<div className="font-medium text-base leading-tight">{item.collateralization}</div>
					</div>

					<div className="w-full flex flex-row justify-between items-center">
						<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Loan due in</div>
						<div className="font-medium text-base leading-tight">{item.loanDueIn}</div>
					</div>

					<div className="w-full flex flex-row justify-between items-center">
						<div className="text-text-muted2 text-xs font-medium leading-[1.125rem]">Amount borrowed</div>
						<div className="font-extrabold text-base leading-tight">{item.amountBorrowed}</div>
					</div>

					<SecondaryButton className="flex w-full mt-2 mb-4 py-1 px-3">{t("dashboard.manage")}</SecondaryButton>
				</div>
			))}
		</div>
	);
};

export const MyBorrow = () => {
	const { t } = useTranslation();

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<div className="pb-7 items-center justify-start flex gap-2">
				<span className="text-text-primary text-2xl font-black">{t("dashboard.my_borrow")}</span>
			</div>
			<div className="w-full flex flex-row justify-between items-center">
				<DesktopTable borrowData={mockData} />
				<MobileTable borrowData={mockData} />
			</div>
			<div className="w-full pt-5 flex-1 flex items-end">
				<div className="flex flex-row items-center w-full">
					<span className="text-text-primary pr-4 text-base font-extrabold leading-[1.25rem]">{t("dashboard.total_owed")}</span>
					<span className="text-text-primary text-base font-medium leading-[1.25rem]">12,300.00 dEURO</span>
				</div>
			</div>
		</div>
	);
};
