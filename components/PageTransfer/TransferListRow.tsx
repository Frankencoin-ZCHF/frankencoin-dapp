import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import TableRow from "@components/Table/TableRow";
import { TransferReferenceQuery } from "@frankencoin/api";
import { ChainId } from "@frankencoin/zchf";
import { ContractUrl, formatCurrency, getChain, getChainByChainSelector, shortenAddress, shortenStringAdjust, TxUrl } from "@utils";
import { formatUnits, Hash } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: TransferReferenceQuery;
}

export default function TransferListRow({ headers, tab, item }: Props) {
	const dateArr: string[] = new Date(item.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	const sourceChain = getChain(item.chainId as ChainId);
	const targetChain = getChainByChainSelector(item.targetChain);

	return (
		<>
			<TableRow headers={headers} tab={tab} rawHeader={true}>
				<div className="flex flex-col md:text-left max-md:text-right">
					<AppLink className="" label={dateStr} href={TxUrl(item.txHash as Hash, sourceChain)} external={true} />
				</div>

				<div className="flex items-center justify-end gap-2">
					<ChainLogo chain={sourceChain.name} size={6} />
					<AppLink
						className=""
						label={shortenAddress(item.from)}
						href={ContractUrl(item.from, sourceChain)}
						external={true}
						/>
				</div>

				<div className="flex items-center justify-end gap-2">
					<ChainLogo chain={targetChain.name} size={6} />
					<AppLink
						className=""
						label={shortenAddress(item.to)}
						href={ContractUrl(item.to, targetChain)}
						external={true}
					/>
				</div>

				<div className="flex flex-col">{shortenStringAdjust(item.reference, 8)}</div>

				<div className="">{formatCurrency(formatUnits(BigInt(item.amount), 18))} ZCHF</div>
			</TableRow>
		</>
	);
}
