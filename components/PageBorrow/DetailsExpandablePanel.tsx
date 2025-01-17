import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  formatCurrency, shortenAddress } from "@utils";
import { formatUnits } from "viem";
import Link from "next/link";

interface DetailsExpandablePanelProps {
	loanDetails?: {
		loanAmount: bigint;
		feePercent: bigint;
		fees: bigint;
		borrowersReserveContribution: bigint;
		amountToSendToWallet: bigint;
		requiredCollateral: bigint;
		originalPosition: `0x${string}`;
		effectiveInterest: number;
		effectiveLTV: number;
		collateralPriceDeuro: number;
	};
}

const defaultLoanDetails = {
	loanAmount: BigInt(0),
	feePercent: BigInt(0),
	fees: BigInt(0),
	borrowersReserveContribution: BigInt(0),
	amountToSendToWallet: BigInt(0),
	requiredCollateral: BigInt(0),
	originalPosition: "0x0000000000000000000000000000000000000000" as `0x${string}`,
	effectiveInterest: 0,
	effectiveLTV: 0,
	collateralPriceDeuro: 0,
};

export function DetailsExpandablePanel({ loanDetails = defaultLoanDetails }: DetailsExpandablePanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="self-stretch px-4 flex flex-col bg-layout-primary rounded-xl">
			<button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 flex justify-between items-center">
				<span className="text-base font-extrabold leading-tight">Details</span>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
				/>
			</button>

			<div className={`grid transition-all duration-300 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
				<div className="overflow-hidden">
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Loan amount</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.loanAmount, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Retained Reserve</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.borrowersReserveContribution, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Expected interest for the selected period</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(formatUnits(loanDetails.fees, 18))} dEURO
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Effective Annual Interest</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">
							{formatCurrency(loanDetails.effectiveInterest * 100)}%
						</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">APR</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">0%</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Market Price</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">{formatCurrency(loanDetails.collateralPriceDeuro)} dEURO</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Loan-To-Value</span>
						<span className="text-right text-sm font-extrabold leading-none tracking-tight">{formatCurrency(loanDetails.effectiveLTV * 100)}%</span>
					</div>
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">Original Position</span>
						<Link className="underline text-right text-sm font-extrabold leading-none tracking-tight" href={`/monitoring/${loanDetails.originalPosition}`}>
							{shortenAddress(loanDetails.originalPosition)}
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
