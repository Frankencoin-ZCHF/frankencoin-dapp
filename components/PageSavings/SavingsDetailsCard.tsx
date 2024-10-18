import AppCard from "@components/AppCard";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	balance: bigint;
	change: bigint;
	direction: boolean;
	interest: bigint;
	locktime: bigint;
}

export default function SavingsDetailsCard({ balance, change, direction, interest, locktime }: Props) {
	return (
		<AppCard>
			<div className="text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1">Your current balance</div>
					<div className="">{formatCurrency(formatUnits(balance, 18))} ZCHF</div>
				</div>
				<div className="flex">
					<div className="flex-1">{direction ? "To be added from your wallet" : "Withdrawn to your wallet"}</div>
					<div className="">{formatCurrency(formatUnits(change, 18))} ZCHF</div>
				</div>
				<div className="flex">
					<div className="flex-1">Interest to be collected</div>
					<div className="">{formatCurrency(formatUnits(interest, 18))} ZCHF</div>
				</div>
				<hr className="border-slate-700 border-dashed" />
				<div className="flex font-bold">
					<div className="flex-1">Resulting balance</div>
					<div className="">{formatCurrency(formatUnits(balance + change + interest, 18))} ZCHF</div>
				</div>

				<div className="flex mt-8">
					<div className={`flex-1`}>
						When saving additional funds, your balance will be locked until interest starts accruing, which can take up to three days. This rules serves to disincentivize the saving of funds held for transactional purposes. {" "}
						<span className="font-semibold">
							{locktime > 0
								? `Your funds are still locked for ${formatCurrency(
										(parseFloat(locktime.toString()) / 60 / 60).toString()
								  )} hours.`
								: ""}
						</span>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
