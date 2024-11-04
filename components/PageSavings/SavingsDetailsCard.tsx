import AppCard from "@components/AppCard";
import { useChainId } from "wagmi";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface Props {
	balance: bigint;
	change: bigint;
	direction: boolean;
	interest: bigint;
	locked: boolean;
}

export default function SavingsDetailsCard({ balance, change, direction, interest, locked }: Props) {
	const chainId = useChainId();
	const amount = 1000n;

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
					<div className="">{formatCurrency(formatUnits(balance + (direction ? change : -change) + interest, 18))} ZCHF</div>
				</div>

				<div className="flex mt-8">
					<div className={`flex-1 ${locked ? "" : "hidden"}`}>
						<span className="font-bold">Note:</span> Interest will be shifted for an weighted avg. of 3 days into the future,
						the primarly use case is to lock the funds for 3 days.
					</div>
				</div>
			</div>
		</AppCard>
	);
}
