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
	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left">{item.year}</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.otherCosts), 18))} ZCHF</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.interestPaid), 18))} ZCHF</div>
		</TableRow>
	);
}
