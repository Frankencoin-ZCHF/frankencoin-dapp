import AppLink from "@components/AppLink";
import TableRow from "@components/Table/TableRow";
import { TransferReferenceQuery } from "@frankencoin/api";
import { ContractUrl, formatCurrency, shortenAddress, TxUrl } from "@utils";
import { formatUnits, Hash } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: TransferReferenceQuery;
}

export default function TransferListRow({ headers, tab, item }: Props) {
	const dateArr: string[] = new Date(item.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<>
			<TableRow headers={headers} tab={tab} rawHeader={true}>
				<div className="flex flex-col md:text-left max-md:text-right">
					<AppLink className="" label={dateStr} href={TxUrl(item.txHash as Hash)} external={true} />
				</div>

				<AppLink className="" label={shortenAddress(item.from)} href={ContractUrl(item.from)} external={true} />

				<AppLink className="" label={shortenAddress(item.to)} href={ContractUrl(item.to)} external={true} />

				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.amount), 18))} ZCHF</div>

				<div className="flex flex-col">{item.ref}</div>
			</TableRow>
		</>
	);
}
