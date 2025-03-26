import TableRow from "@components/Table/TableRow";
import { ContractUrl, formatCurrency, shortenAddress, TxUrl } from "@utils";
import { formatUnits, Hash } from "viem";
import { AccountYearly } from "./SavingsYearlyTable";

interface Props {
	headers: string[];
	tab: string;
	item: AccountYearly;
}

export default function SavingsYearlyRow({ headers, tab, item }: Props) {
	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left">{item.year}</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.collected), 18))} ZCHF</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.balance), 18))} ZCHF</div>
		</TableRow>
	);
}
