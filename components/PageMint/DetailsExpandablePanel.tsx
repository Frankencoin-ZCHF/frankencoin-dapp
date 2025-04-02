import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatCurrency, shortenAddress } from "@utils";
import { formatUnits } from "viem";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { LoanDetails } from "../../utils/loanCalculations";
import { ExpandablePanel } from "../ExpandablePanel";
interface DetailsExpandablePanelProps {
	loanDetails?: LoanDetails;
	collateralPriceDeuro: number;
	collateralDecimals: number;
	startingLiquidationPrice: bigint;
	extraRows?: React.ReactNode;
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

export function DetailsExpandablePanel({
	loanDetails = defaultLoanDetails,
	collateralPriceDeuro = 0,
	collateralDecimals = 0,
	startingLiquidationPrice = 0n,
	extraRows = null,
}: DetailsExpandablePanelProps) {
	const { t } = useTranslation();

	const effectiveLTV =
		Number(formatUnits(loanDetails.loanAmount, 18)) * 100 /
		(Number(formatUnits(loanDetails.requiredCollateral, collateralDecimals)) * collateralPriceDeuro) || 0;

	return (
		<ExpandablePanel title={t("mint.details")}>
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
					{formatCurrency(formatUnits(startingLiquidationPrice, 36 - collateralDecimals))} €
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
				<span className="text-right text-sm font-extrabold leading-none tracking-tight">{formatCurrency(effectiveLTV)}%</span>
			</div>
			{extraRows}
		</ExpandablePanel>
	);
}
