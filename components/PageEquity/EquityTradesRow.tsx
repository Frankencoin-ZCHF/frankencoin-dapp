import AppLink from "@components/AppLink";
import TableRow from "@components/Table/TableRow";
import { SupportedChains } from "@frankencoin/zchf";
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
	const isInvest = item.kind === "Invested";
	// invest: fee = amount * 0.3% | redeem: received is post-fee, so fee = amount * (1/0.997 - 1) = amount * 3/997
	const fee = isInvest ? (item.amount * 3n) / 1000n : (item.amount * 3n) / 997n;

	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<div className="flex flex-col md:text-left max-md:text-right">
				<AppLink className="" label={dateStr} href={TxUrl(item.txHash as Hash, SupportedChains.mainnet)} external={true} />
			</div>

			<div className={`flex flex-col`}>
				{isInvest ? "-" : ""}
				{formatCurrency(formatUnits(item.amount, 18))} ZCHF
			</div>

			<div className={`flex flex-col`}>{formatCurrency(formatUnits(item.shares, 18))} FPS</div>

			<div className="flex flex-col">{formatCurrency(formatUnits((item.amount * 10n ** 18n) / item.shares, 18))} ZCHF</div>
		</TableRow>
	);
}
