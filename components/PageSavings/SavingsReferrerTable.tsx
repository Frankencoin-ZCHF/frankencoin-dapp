import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { ChainId } from "@frankencoin/zchf";
import { useSavingsReferrerMappings, SavingsReferrerMapping } from "@hooks";
import SavingsReferrerRow from "./SavingsReferrerRow";

export interface AggregatedSavingsReferrer {
	referrer: Address;
	balance: bigint;
	accounts: Address[];
	chainIds: ChainId[];
}

export default function SavingsReferrerTable() {
	const headers: string[] = ["Referrer", "Savers", "Chains", "Balance"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { loading, mappings } = useSavingsReferrerMappings();

	const aggregated = useMemo(() => aggregateByReferrer(mappings), [mappings]);
	const sorted: AggregatedSavingsReferrer[] = sortFunction({ list: aggregated, headers, tab, reverse });

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
			<TableBody>
				{sorted.length == 0 ? (
					<TableRowEmpty>{loading ? "Loading..." : "There are no referrals yet."}</TableRowEmpty>
				) : (
					sorted.map((r, idx) => <SavingsReferrerRow headers={headers} tab={tab} key={r.referrer || `SavingsReferrerRow_${idx}`} item={r} />)
				)}
			</TableBody>
		</Table>
	);
}

function aggregateByReferrer(mappings: SavingsReferrerMapping[]): AggregatedSavingsReferrer[] {
	const byReferrer = new Map<Address, AggregatedSavingsReferrer>();

	for (const m of mappings) {
		const balance = BigInt(m.balance);
		const existing = byReferrer.get(m.referrer);

		if (existing) {
			existing.balance += balance;
			existing.accounts.push(m.account);
			if (!existing.chainIds.includes(m.chainId)) existing.chainIds.push(m.chainId);
		} else {
			byReferrer.set(m.referrer, { referrer: m.referrer, balance, accounts: [m.account], chainIds: [m.chainId] });
		}
	}

	return Array.from(byReferrer.values());
}

type SortFunctionParams = {
	list: AggregatedSavingsReferrer[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): AggregatedSavingsReferrer[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Referrer
		sortingList.sort((a, b) => b.referrer.localeCompare(a.referrer));
	} else if (tab === headers[1]) {
		// Savers
		sortingList.sort((a, b) => b.accounts.length - a.accounts.length);
	} else if (tab === headers[2]) {
		// Chains
		sortingList.sort((a, b) => b.chainIds.length - a.chainIds.length);
	} else if (tab === headers[3]) {
		// Balance
		sortingList.sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
