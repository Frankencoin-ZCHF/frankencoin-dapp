import { formatUnits } from "viem";
import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import { useTranslation } from "next-i18next";
import TokenLogo from "@components/TokenLogo";
import Button from "@components/Button";
import { useSavingsInterest } from "../../hooks/useSavingsInterest";

export default function SavingsCollectInterest() {
	const { isClaiming, interestToBeCollected, claimInterest } = useSavingsInterest();
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
				<div>
					<Button className="!py-1.5" onClick={claimInterest} isLoading={isClaiming} disabled={!interestToBeCollected}>
						<span className="font-medium">{t("savings.collect_interest")}</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
