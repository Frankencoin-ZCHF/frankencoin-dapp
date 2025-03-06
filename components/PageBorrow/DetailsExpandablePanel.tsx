import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatCurrency, shortenAddress } from "@utils";
import { formatUnits } from "viem";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { LoanDetails } from "../../utils/loanCalculations";

interface DetailsExpandablePanelProps {
	loanDetails?: LoanDetails;
	collateralPriceDeuro: number;
}

const defaultLoanDetails = {
	loanAmount: BigInt(0),
	apr: 0,
	borrowersReserveContribution: BigInt(0),
	amountToSendToWallet: BigInt(0),
	requiredCollateral: BigInt(0),
	originalPosition: "0x0000000000000000000000000000000000000000" as `0x${string}`,
	effectiveInterest: 0,
	interestUntilExpiration: BigInt(0),
	liquidationPrice: BigInt(0),
	startingLiquidationPrice: BigInt(0),
};

export function DetailsExpandablePanel({ loanDetails = defaultLoanDetails, collateralPriceDeuro = 0 }: DetailsExpandablePanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const { t } = useTranslation();

	const effectiveLTV = Number(loanDetails.loanAmount) / (Number(loanDetails.requiredCollateral) * collateralPriceDeuro) || 0;

	return (
		<div className="self-stretch px-4 flex flex-col bg-layout-primary rounded-xl">
			<button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 flex justify-between items-center">
				<span className="text-base font-extrabold leading-tight">{t("mint.details")}</span>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
				/>
			</button>

			<div className={`grid transition-all duration-300 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
				<div className="overflow-hidden">
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.loan_amount")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.loanAmount, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.retained_reserve")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.borrowersReserveContribution, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.expected_interest")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.interestUntilExpiration, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.starting_liquidation_price")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.startingLiquidationPrice, 18))} €
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.liquidation_price_at_expiration")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.liquidationPrice, 18))} €
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.effective_annual_interest")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(loanDetails.effectiveInterest)}%
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.apr")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">{formatCurrency(loanDetails.apr)}%</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.market_price")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(collateralPriceDeuro)} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.loan_to_value")}</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(effectiveLTV * 100)}%
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("mint.original_position")}</span>
						<Link
							className="underline text-right text-sm font-extrabold leading-none tracking-tight"
							href={`/monitoring/${loanDetails.originalPosition}`}
						>
							{ shortenAddress(loanDetails.originalPosition)}
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
