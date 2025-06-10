import { useTranslation } from "next-i18next";
import { HeaderCell, LinkTitle, NoDataRow } from "./SectionTable";
import { formatUnits } from "viem";
import Button, { SecondaryButton } from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import { useSavingsInterest } from "../../hooks/useSavingsInterest";
import Image from "next/image";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SavingsRow = ({
	balance,
	totalEarnedInterest,
	interestToBeCollected,
}: {
	balance: bigint;
	totalEarnedInterest: bigint;
	interestToBeCollected: bigint;
}) => {
	return (
		<>
			<div className="pr-3 flex items-center">
				<TokenLogo currency={TOKEN_SYMBOL} size={8} />
			</div>
			<span className="flex items-center text-text-primary text-base font-extrabold">{formatCurrency(formatUnits(balance, 18))}</span>
			<span className="flex items-center text-text-primary text-base font-medium">
				{formatCurrency(formatUnits(totalEarnedInterest, 18))}
			</span>
			<span className="flex items-center text-text-primary text-base font-medium">
				{formatCurrency(formatUnits(interestToBeCollected, 18))}
			</span>
		</>
	);
};

export const MySavings = () => {
	const { userSavingsBalance, totalEarnedInterest, interestToBeCollected, isReinvesting, isClaiming, claimInterest, handleReinvest } = useSavingsInterest();
	const { t } = useTranslation();

	const savingsData = userSavingsBalance > 0n || totalEarnedInterest > 0n || interestToBeCollected > 0n;

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<LinkTitle href={"/savings"}>{t("dashboard.my_savings")}</LinkTitle>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_auto] gap-y-1">
					<span className="w-11 pr-3"></span>
					<HeaderCell>{t("dashboard.current_investment")}</HeaderCell>
					<HeaderCell>{t("dashboard.total_earned")}</HeaderCell>
					<HeaderCell>{t("dashboard.interest_to_be_collected")}</HeaderCell>
					{savingsData ? (
						<SavingsRow
							balance={userSavingsBalance}
							totalEarnedInterest={totalEarnedInterest}
							interestToBeCollected={interestToBeCollected}
						/>
					) : (
						<NoDataRow className="col-span-3">{t("dashboard.no_savings_yet")}</NoDataRow>
					)}
				</div>
			</div>
			{savingsData && (
				<div className="w-full flex-1 pt-10 flex items-end gap-4">
					<Button className="w-full h-10 py-2.5 px-4" disabled={interestToBeCollected === 0n} isLoading={isReinvesting} onClick={handleReinvest}>
						<FontAwesomeIcon icon={faRotateRight} />
						{t("dashboard.reinvest")}
					</Button>
					<SecondaryButton className="w-full h-10 py-2.5 px-4" disabled={interestToBeCollected === 0n} isLoading={isClaiming} onClick={claimInterest}>
						<Image src="/icons/ph_hand-coins-black.svg" alt="arrow-right" width={20} height={20} />
						{t("dashboard.collect_interest")}
					</SecondaryButton>
				</div>
			)}
		</div>
	);
};
