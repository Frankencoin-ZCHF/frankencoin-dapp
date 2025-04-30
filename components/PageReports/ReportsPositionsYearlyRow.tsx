import TableRow from "@components/Table/TableRow";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";
import { AccountYearly } from "./ReportsPositionsYearlyTable";

interface Props {
	headers: string[];
	tab: string;
	item: AccountYearly;
}

export default function ReportsPositionsYearlyRow({ headers, tab, item }: Props) {
	const current = new Date().getFullYear();
	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left">{item.year == current ? "Current" : item.year}</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.interestPaid), 18))} ZCHF</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.openDebt), 18))} ZCHF</div>

			{/* <div className="flex flex-col">{formatCurrency(formatUnits(BigInt(0n), 18))} ZCHF</div> */}
		</TableRow>
	);
}
