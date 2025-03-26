import { Hash, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { MinterQuery } from "@deuro/api";
import { useContractUrl } from "@hooks";
import GovernanceMintersAction from "./GovernanceMintersAction";
import { AddressLabelSimple, TxLabelSimple } from "@components/AddressLabel";
import { useTranslation } from "next-i18next";
interface Props {
	headers: string[];
	minter: MinterQuery;
	tab: string;
}

export default function GovernanceMintersRow({ headers, minter, tab }: Props) {
	const url = useContractUrl(minter.minter || zeroAddress);
	const { t } = useTranslation();
	if (!minter) return null;

	const vetoUntil = (minter.applyDate + minter.applicationPeriod) * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = `${Math.round(hoursUntil)} hours left`;

	const passed: boolean = hoursUntil < 0;
	const vetoed: boolean = minter.vetor ? true : false;
	const isDisabled: boolean = vetoed || passed;

	const dateArr: string[] = new Date(minter.applyDate * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow
			headers={headers}
			actionCol={
				<div className="">
					{isDisabled ? null : <GovernanceMintersAction key={minter.id} minter={minter} disabled={isDisabled} />}
				</div>
			}
			tab={tab}
		>
			<div className="flex flex-col md:text-left max-md:text-right">
				<TxLabelSimple label={dateStr} tx={minter.txHash as Hash} showLink />
			</div>

			{/* Minter */}
			<div className="flex flex-col">
				<AddressLabelSimple address={minter.minter} showLink />
			</div>

			{/* Comment */}
			<div className="flex flex-col">{minter.applyMessage}</div>

			{/* State */}
			<div className={`flex flex-col ${vetoed || passed ? "" : "font-bold"}`}>{vetoed ? t("governance.vetoed") : passed ? t("governance.passed") : stateStr}</div>
		</TableRow>
	);
}
