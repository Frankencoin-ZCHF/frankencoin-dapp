import AppLink from "@components/AppLink";
import TableRow from "@components/Table/TableRow";
import { SavingsBalanceQuery } from "@frankencoin/api";
import { ContractUrl, formatCurrency, shortenAddress } from "@utils";
import { formatUnits } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: SavingsBalanceQuery;
}

export default function SavingsRankedBalancesRow({ headers, tab, item }: Props) {
	const dateArr: string[] = new Date(item.updated * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<>
			<TableRow headers={headers} tab={tab} rawHeader={true}>
				<div className="flex flex-col md:text-left max-md:text-right">{dateStr}</div>

				<AppLink className="" label={shortenAddress(item.id)} href={ContractUrl(item.id)} external={true} />

				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.interest), 18))} ZCHF</div>
				<div className="flex flex-col">{formatCurrency(formatUnits(BigInt(item.balance), 18))} ZCHF</div>
			</TableRow>
		</>
	);
}
