import AppLink from "@components/AppLink";
import TableRow from "@components/Table/TableRow";
import { ContractUrl, formatCurrency, shortenAddress } from "@utils";
import { AggregatedSavingsReferrer } from "./SavingsReferrerTable";
import { formatUnits } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: AggregatedSavingsReferrer;
}

export default function SavingsReferrerRow({ headers, tab, item }: Props) {
	return (
		<TableRow headers={headers} tab={tab} rawHeader={true}>
			<AppLink
				className="flex items-center md:justify-start max-md:justify-end pt-2"
				label={shortenAddress(item.referrer)}
				href={ContractUrl(item.referrer)}
				external={true}
			/>
			<div className="flex flex-col">{item.accounts.length}</div>
			<div className="flex flex-col">{item.chainIds.length}</div>
			<div className="flex flex-col">{formatCurrency(formatUnits(item.balance, 18))} ZCHF</div>
		</TableRow>
	);
}
