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
					<div className="flex-1">Current saved amount</div>
					<div className="">{formatCurrency(formatUnits(balance, 18))} ZCHF</div>
				</div>
				<div className="flex">
					<div className="flex-1">{direction ? "You put into savings" : "You withdraw from savings"}</div>
					<div className="">{formatCurrency(formatUnits(change, 18))} ZCHF</div>
				</div>
				<div className="flex">
					<div className="flex-1">Accured Interest</div>
					<div className="">{formatCurrency(formatUnits(interest, 18))} ZCHF</div>
				</div>
				<hr className="border-slate-700 border-dashed" />
				<div className="flex font-bold">
					<div className="flex-1">Future saved amount</div>
					<div className="">{formatCurrency(formatUnits(balance + change + interest, 18))} ZCHF</div>
				</div>

				<div className="flex mt-8">
					<div className={`flex-1`}>
						<span className="font-bold">Note:</span> Interest will be shifted for 3 days into the future (weighted average). The
						primarly use case is to lock the funds for 3 days.{" "}
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
