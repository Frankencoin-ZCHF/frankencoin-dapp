import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import TableRow from "@components/Table/TableRow";
import { ContractUrl, formatCurrency, getChain, shortenAddress } from "@utils";
import { AggregatedSavingsReferrer } from "./SavingsReferrerTable";
import { formatUnits } from "viem";

interface Props {
	headers: string[];
	tab: string;
	item: AggregatedSavingsReferrer;
}

export default function SavingsReferrerRow({ headers, tab, item }: Props) {
	const [expanded, setExpanded] = useState(false);
	const hasBreakdown = item.chainBreakdown.length > 0;

	return (
		<>
			<TableRow headers={headers} tab={tab} rawHeader={true}>
				<AppLink
					className="flex items-center md:justify-start max-md:justify-end pt-2"
					label={shortenAddress(item.referrer)}
					href={ContractUrl(item.referrer)}
					external={true}
				/>
				<div className="flex flex-col">{item.accounts.length}</div>
				<button
					type="button"
					className={`flex items-center justify-end gap-2 ${hasBreakdown ? "cursor-pointer" : "cursor-default"}`}
					onClick={() => hasBreakdown && setExpanded(!expanded)}
				>
					<span>{item.chainBreakdown.length}</span>
					{hasBreakdown && <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="w-3" />}
				</button>
				<div className="flex flex-col">{formatCurrency(formatUnits(item.balance, 18))} ZCHF</div>
			</TableRow>

			{expanded && hasBreakdown && (
				<div className="bg-card-body-primary px-8 xl:px-12 py-4 border-t border-table-header-secondary">
					<div className="sm:pl-8 grid grid-cols-4 items-center text-text-header font-bold text-sm pb-2">
						<div />
						<div className="text-right">Savers</div>
						<div className="text-right">Chain</div>
						<div className="text-right">Balance</div>
					</div>
					{item.chainBreakdown.map((c) => {
						const chain = getChain(c.chainId);
						return (
							<div key={c.chainId} className="sm:pl-8 grid grid-cols-4 items-center py-1 text-sm">
								<div />
								<div className="text-right">{c.savers}</div>
								<div className="flex items-center justify-end gap-2">
									<ChainLogo chain={chain.name} size={5} />
									<span>{chain.name}</span>
								</div>
								<div className="text-right">{formatCurrency(formatUnits(c.balance, 18))} ZCHF</div>
							</div>
						);
					})}
				</div>
			)}
		</>
	);
}
