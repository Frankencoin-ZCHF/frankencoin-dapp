import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { ChainId } from "@frankencoin/zchf";
import { useSavingsReferrerMappings, SavingsReferrerMapping } from "@hooks";
import SavingsReferrerRow from "./SavingsReferrerRow";

export interface SavingsReferrerChainBreakdown {
	chainId: ChainId;
	savers: number;
	balance: bigint;
}

export interface AggregatedSavingsReferrer {
	referrer: Address;
	balance: bigint;
	accounts: Address[];
	chainBreakdown: SavingsReferrerChainBreakdown[];
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
	type Building = {
		referrer: Address;
		balance: bigint;
		accounts: Address[];
		chainBreakdown: Map<ChainId, { accounts: Set<Address>; balance: bigint }>;
	};
	const byReferrer = new Map<Address, Building>();

	for (const m of mappings) {
		const balance = BigInt(m.balance);
		const existing = byReferrer.get(m.referrer);
		const building: Building = existing ?? { referrer: m.referrer, balance: 0n, accounts: [], chainBreakdown: new Map() };
		if (!existing) byReferrer.set(m.referrer, building);

		building.balance += balance;
		building.accounts.push(m.account);

		const chain = building.chainBreakdown.get(m.chainId) ?? { accounts: new Set<Address>(), balance: 0n };
		chain.accounts.add(m.account);
		chain.balance += balance;
		building.chainBreakdown.set(m.chainId, chain);
	}

	return Array.from(byReferrer.values()).map((b) => ({
		referrer: b.referrer,
		balance: b.balance,
		accounts: b.accounts,
		chainBreakdown: Array.from(b.chainBreakdown.entries()).map(([chainId, c]) => ({
			chainId,
			savers: c.accounts.size,
			balance: c.balance,
		})),
	}));
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
		sortingList.sort((a, b) => b.chainBreakdown.length - a.chainBreakdown.length);
	} else if (tab === headers[3]) {
		// Balance
		sortingList.sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
