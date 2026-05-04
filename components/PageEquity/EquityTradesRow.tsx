import AppLink from "@components/AppLink";
import TableRow from "@components/Table/TableRow";
import { ChainMain, SupportedChains } from "@frankencoin/zchf";
import { EquityTrade } from "@hooks";
import { TxUrl, formatCurrency } from "@utils";
import { formatUnits, Hash } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: EquityTrade;
}

export default function EquityTradesRow({ headers, tab, item }: Props) {
	const dateArr = new Date(item.created * 1000).toDateString().split(" ");
	const dateStr = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left max-md:text-right">
				<AppLink className="" label={dateStr} href={TxUrl(item.txHash as Hash, SupportedChains.mainnet)} external={true} />
			</div>

			<div className="flex flex-col">{item.kind}</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.amount, 18))} ZCHF</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.shares, 18))} FPS</div>

			<div className="flex flex-col">{formatCurrency(formatUnits(item.price, 18))} ZCHF</div>
		</TableRow>
	);
}
