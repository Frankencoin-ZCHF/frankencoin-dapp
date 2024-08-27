import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { MinterQuery } from "@frankencoin/api";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import GovernanceMintersVeto from "./GovernanceMintersVeto";
import AddressLabel from "@components/AddressLabel";

interface Props {
	minter: MinterQuery;
}

export default function GovernanceMintersRow({ minter }: Props) {
	const url = useContractUrl(minter.minter || zeroAddress);
	if (!minter) return null;

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(url, "_blank");
	};

	const vetoUntil = (minter.applyDate + minter.applicationPeriod) * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = `${Math.round(hoursUntil)} hours left`;

	const passed: boolean = Date.now() > vetoUntil;
	const vetoed: boolean = minter.vetor ? true : false;
	const isDisabled: boolean = vetoed || passed;

	return (
		<TableRow
			actionCol={
				<div className="">
					<GovernanceMintersVeto key={minter.id} minter={minter} disabled={isDisabled} />
				</div>
			}
		>
			{/* Minter */}
			<div className="flex items-center">
				<AddressLabel address={minter.minter} showCopy showLink />
			</div>

			{/* Comment */}
			<div className="flex flex-col">{minter.applyMessage}</div>

			{/* State */}
			<div className={`flex flex-col font-bold ${vetoed ? "text-red-500" : passed ? "text-green-300" : ""}`}>
				{vetoed ? "Vetoed" : passed ? "Passed" : stateStr}
			</div>
		</TableRow>
	);
}
