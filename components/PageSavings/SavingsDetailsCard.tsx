import AppCard from "@components/AppCard";
import { ContractUrl, formatCurrency } from "@utils";
import { Address, formatUnits, zeroAddress } from "viem";
import SavingsActionRedeem from "./SavingsActionRedeem";
import AppLink from "@components/AppLink";
import { SupportedChain } from "@frankencoin/zchf";

interface Props {
	chain: SupportedChain;
	balance: bigint;
	change: bigint;
	direction: boolean;
	interest: bigint;
	locktime: bigint;
	referrer: Address;
	referralFeePPM: bigint;
	referralFees: bigint;
}

export default function SavingsDetailsCard({
	chain,
	balance,
	change,
	direction,
	interest,
	locktime,
	referrer,
	referralFeePPM,
	referralFees,
}: Props) {
	return (
		<AppCard>
			<div className="text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Your current balance</div>
					<div className="">{formatCurrency(formatUnits(balance, 18))} ZCHF</div>
				</div>
				<div className="flex">
					<div className="flex-1 text-text-secondary">
						{direction ? "To be added from your wallet" : "Withdrawn to your wallet"}
					</div>
					<div className="">
						{change < 0n ? "-" : ""} {formatCurrency(formatUnits(change < 0n ? -change : change, 18))} ZCHF
					</div>
				</div>
				<div className="flex">
					<div className="flex-1 text-text-secondary">Interest to be collected</div>
					<div className="">{formatCurrency(formatUnits(interest, 18))} ZCHF</div>
				</div>

				{referrer != zeroAddress ? (
					<div className="flex">
						<div className="flex-1 text-text-secondary">
							Pay out to <AppLink className="pr-2" label="referrer" href={ContractUrl(referrer, chain)} external={true} />(
							{Math.round(Number(referralFeePPM / 1000n)) / 10}%)
						</div>
						<div className="">- {formatCurrency(formatUnits(referralFees, 18))} ZCHF</div>
					</div>
				) : null}

				<hr className="border-slate-700 border-dashed" />

				<div className="flex font-bold">
					<div className="flex-1 text-text-secondary">Resulting balance</div>
					<div className="">
						{formatCurrency(formatUnits(balance + change + interest - (referrer != zeroAddress ? referralFees : 0n), 18))} ZCHF
					</div>
				</div>

				<div className="flex mt-8">
					<div className={`flex-1 text-text-secondary`}>
						{locktime > 0
							? `Interest starts to continuously accrue after three days, in your case in ${formatCurrency(
									(parseFloat(locktime.toString()) / 60 / 60).toString()
							  )} hours.`
							: ""}
					</div>
				</div>

				<div className="flex mt-6">
					<SavingsActionRedeem />
				</div>
			</div>
		</AppCard>
	);
}
