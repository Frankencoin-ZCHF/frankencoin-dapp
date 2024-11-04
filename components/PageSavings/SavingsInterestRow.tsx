import { TxLabelSimple } from "@components/AddressLabel";
import TableRow from "@components/Table/TableRow";
import { SavingsInterestQuery } from "@frankencoin/api";
import { formatCurrency } from "@utils";
import { formatUnits, Hash } from "viem";

interface Props {
	headers: string[];
	item: SavingsInterestQuery;
}

export default function SavingsInterestRow({ headers, item }: Props) {
	const dateArr: string[] = new Date(item.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<>
			<TableRow headers={headers}>
				<div className="flex flex-col md:text-left max-md:text-right">
					<TxLabelSimple label={dateStr} tx={item.txHash as Hash} showLink />
				</div>

				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.amount), 18))} ZCHF</div>

				<div className={`flex flex-col`}>{formatCurrency(item.rate / 10_000)} %</div>

				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.balance), 18))} ZCHF</div>

				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.total), 18))} ZCHF</div>
			</TableRow>
		</>
	);
}
