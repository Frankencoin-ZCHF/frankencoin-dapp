import { Hash, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { MinterQuery } from "@frankencoin/api";
import { useContractUrl } from "@hooks";
import GovernanceMintersAction from "./GovernanceMintersAction";
import AppLink from "@components/AppLink";
import { ContractUrl, shortenAddress, TxUrl } from "@utils";

interface Props {
	headers: string[];
	tab: string;
	minter: MinterQuery;
}

export default function GovernanceMintersRow({ headers, tab, minter }: Props) {
	const url = useContractUrl(minter.minter || zeroAddress);
	if (!minter) return null;

	const vetoUntil = (minter.applyDate + minter.applicationPeriod) * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = hoursUntil < 1.5 ? `${Math.round(hoursUntil * 60)} minutes left` : `${Math.round(hoursUntil)} hours left`;

	const passed: boolean = hoursUntil < 0;
	const vetoed: boolean = minter.vetor ? true : false;
	const isDisabled: boolean = vetoed || passed;

	const dateArr: string[] = new Date(minter.applyDate * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow
			headers={headers}
			rawHeader={true}
			tab={tab}
			actionCol={
				<div className="">
					{isDisabled ? null : <GovernanceMintersAction key={minter.id} minter={minter} disabled={isDisabled} />}
				</div>
			}
		>
			<div className="flex flex-col md:text-left max-md:text-right">
				<AppLink label={dateStr} href={TxUrl(minter.txHash as Hash)} external={true} className="" />
			</div>

			{/* Minter */}
			<div className="flex flex-col">
				<AppLink label={shortenAddress(minter.minter)} href={ContractUrl(minter.minter)} external={true} className="" />
			</div>

			{/* Comment */}
			<div className="flex flex-col">{minter.applyMessage}</div>

			{/* State */}
			<div className={`flex flex-col ${vetoed || passed ? "" : "font-bold"}`}>{vetoed ? "Vetoed" : passed ? "Passed" : stateStr}</div>
		</TableRow>
	);
}
