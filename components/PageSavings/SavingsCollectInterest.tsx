import { formatUnits } from "viem";
import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import { useTranslation } from "next-i18next";
import TokenLogo from "@components/TokenLogo";
import Button, { SecondaryButton } from "@components/Button";
import { useSavingsInterest } from "../../hooks/useSavingsInterest";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateRight } from "@fortawesome/free-solid-svg-icons";

export default function SavingsCollectInterest() {
	const { isClaiming, interestToBeCollected, claimInterest, isReinvesting, handleReinvest } = useSavingsInterest();
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-y-3">
			<div className="pb-1 flex flex-row justify-start items-center border-b border-b-borders-dividerLight">
				<span className="text-text-disabled font-medium text-base leading-tight">{t("savings.interest_to_be_collected")}</span>
			</div>
			<div className="flex flex-row justify-between items-center">
				<div className="pl-3 flex flex-row gap-x-2 items-center">
					<TokenLogo currency={TOKEN_SYMBOL} />
					<div className="flex flex-col">
						<span className="text-base font-extrabold leading-tight">
							<span className="">{formatCurrency(formatUnits(interestToBeCollected, 18))}</span> {TOKEN_SYMBOL}
						</span>
						<span className="text-xs font-medium text-text-muted2 leading-[1rem]"></span>
					</div>
				</div>
				<div className="flex flex-row gap-x-2.5">
					<Button className="h-9 !py-1.5 gap-x-1.5 justify-start !w-fit" disabled={!interestToBeCollected} isLoading={isReinvesting} onClick={handleReinvest}>
						<FontAwesomeIcon icon={faArrowRotateRight} />
						<span className="font-medium">{t("savings.reinvest")}</span>
					</Button>
					<SecondaryButton className="!py-1.5 gap-x-1.5" onClick={claimInterest} isLoading={isClaiming} disabled={!interestToBeCollected}>
						<Image src="/icons/ph_hand-coins-black.svg" alt="arrow-right" width={20} height={20} />
						<span className="font-medium">{t("savings.collect_interest")}</span>
					</SecondaryButton>
				</div>
			</div>
		</div>
	);
}
