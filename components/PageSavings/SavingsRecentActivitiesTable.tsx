import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { SavingsActivityQuery } from "@frankencoin/api";
import SavingsRecentActivitiesRow from "./SavingsRecentActivitiesRow";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function SavingsRecentActivitiesTable() {
	const headers: string[] = ["Date", "Saver", "Kind", "Amount", "Balance"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<SavingsActivityQuery[]>([]);
	const chainId = useChainId() as ChainId;
	const { address } = useAccount();

	const activities = useSelector((state: RootState) => state.savings.savingsActivity);
	const ignoreModule = ADDRESS[mainnet.id].savingsV2.toLowerCase();
	const matching = activities.filter((l) => l.chainId == chainId && l.module.toLowerCase() != ignoreModule).slice(0, 20);

	const sorted: SavingsActivityQuery[] = sortFunction({ list: matching, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => `${l.chainId}-${l.account}-${l.module}-${l.count}-${l.kind}`).join("_");
		const idSorted = sorted.map((l) => `${l.chainId}-${l.account}-${l.module}-${l.count}-${l.kind}`).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

	useEffect(() => {
		if (address == undefined) setList([]);
	}, [address]);

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
				{list.length == 0 ? (
					<TableRowEmpty>{"There are no activities yet."}</TableRowEmpty>
				) : (
					list.map((r, idx) => (
						<SavingsRecentActivitiesRow
							headers={headers}
							tab={tab}
							key={`${r.chainId}-${r.account}-${r.module}-${r.count}-${r.kind}` || `SavingsRecentActivitiesRow_${idx}`}
							item={r}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortFunctionParams = {
	list: SavingsActivityQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): SavingsActivityQuery[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Saver
		sortingList.sort((a, b) => a.account.localeCompare(b.account));
	} else if (tab === headers[2]) {
		// Kind
		sortingList.sort((a, b) => a.kind.localeCompare(b.kind));
	} else if (tab === headers[3]) {
		// Amount
		sortingList.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
	} else if (tab === headers[4]) {
		// Balance
		sortingList.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
