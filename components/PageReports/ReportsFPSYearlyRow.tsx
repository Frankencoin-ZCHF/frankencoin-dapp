import TableRow from "@components/Table/TableRow";
import { Address, formatUnits } from "viem";
import { AccountYearly } from "./ReportsFPSYearlyTable";
import { formatCurrency } from "@utils";

interface Props {
	headers: string[];
	tab: string;
	address: Address;
	item: AccountYearly;
}

export default function ReportsFPSYearlyRow({ headers, tab, address, item }: Props) {
	const current = new Date().getFullYear();
	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left">{item.year == current ? "Current" : item.year}</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.earnings, 18))} ZCHF</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.balance, 18))} FPS</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.value, 18))} ZCHF</div>
		</TableRow>
	);
}
