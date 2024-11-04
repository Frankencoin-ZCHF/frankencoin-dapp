import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import { ADDRESS } from "@frankencoin/zchf";
import { useChainId } from "wagmi";

export default function SavingsDetailsCard() {
	const chainId = useChainId();
	const amount = 1000n;

	return (
		<AppCard>
			<div className="text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1">Current saved amount</div>
					<DisplayAmount amount={BigInt(230)} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
				</div>
				<div className="flex">
					<div className="flex-1">{amount >= BigInt(23423) ? "You put into savings" : "You withdraw from savings"}</div>
					<DisplayAmount amount={234234n} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
				</div>
				<div className="flex">
					<div className="flex-1">Accured Interest</div>
					<DisplayAmount amount={2345n} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
				</div>
				<hr className="border-slate-700 border-dashed" />
				<div className="flex font-bold">
					<div className="flex-1">Future saved amount</div>
					<DisplayAmount amount={amount} currency={"ZCHF"} address={ADDRESS[chainId].frankenCoin} />
				</div>

				<div className="flex mt-8">
					<div className="flex-1">
						<span className="font-bold">Note:</span> Interest will be shifted for an weighted avg. of 3 days into the future,
						the primarly use case is to lock the funds for 3 days.
					</div>
				</div>
			</div>
		</AppCard>
	);
}
