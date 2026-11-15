import TableHeader from "../Table/TableHead";
import TableHeadSearchable, { FilterOption } from "../Table/TableHeadSearchable";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { MinterQuery } from "@frankencoin/api";
import { useEffect, useMemo, useState } from "react";
import { ChainId, SupportedChainsMap } from "@frankencoin/zchf";
import GovernanceMintersRow from "./GovernanceMintersRow";

interface Props {
	length?: number | undefined;
	searchable?: boolean;
}

enum MinterState {
	Vetoed,
	Passed,
	Pending,
}

const STATE_LABEL: Record<MinterState, string> = {
	[MinterState.Vetoed]: "Vetoed",
	[MinterState.Passed]: "Passed",
	[MinterState.Pending]: "Pending",
};

const STATE_OPTIONS: FilterOption[] = [MinterState.Pending, MinterState.Passed, MinterState.Vetoed].map((state) => ({
	label: STATE_LABEL[state],
	value: String(state),
}));

function minterState(m: MinterQuery): MinterState {
	const vetoUntil = (m.applyDate + m.applicationPeriod) * 1000;
	if (m.vetor) return MinterState.Vetoed;
	return Date.now() > vetoUntil ? MinterState.Passed : MinterState.Pending;
}

const chainName = (chainId: number): string => SupportedChainsMap[chainId as ChainId]?.name ?? String(chainId);

export default function GovernanceMintersTable({ length, searchable }: Props) {
	const headers: string[] = ["Date", "Minter", "Chain", "Comment", "State"];
	const [tab, setTab] = useState<string>(headers[4]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<MinterQuery[]>([]);

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeStates, setActiveStates] = useState<string[]>([]);
	const [activeChains, setActiveChains] = useState<string[]>([]);

	const minters = useSelector((state: RootState) => state.ecosystem.frankencoinMinters.list);

	// chains that actually have modules, so every filter option returns something
	const chainOptions = useMemo(() => Array.from(new Set(minters.map((m) => chainName(m.chainId)))).sort(), [minters]);

	const filtered = searchable
		? minters.filter((m) => {
				if (activeStates.length > 0 && !activeStates.includes(String(minterState(m)))) return false;
				if (activeChains.length > 0 && !activeChains.includes(chainName(m.chainId))) return false;
				const q = searchQuery.trim().toLowerCase();
				if (!q) return true;
				return [m.minter, m.applyMessage, chainName(m.chainId), STATE_LABEL[minterState(m)]].some((v) =>
					(v ?? "").toLowerCase().includes(q)
				);
		  })
		: minters;

	const sorted: MinterQuery[] = sortMinters({
		// @dev: somehow it does not transfer a "true array" and causes issues in sorting function
		minters: [...filtered.slice(0, length)],
		headers,
		tab,
		reverse,
	});

	useEffect(() => {
		const idList = list.map((l) => `${l.chainId}:${l.minter}`).join("_");
		const idSorted = sorted.map((l) => `${l.chainId}:${l.minter}`).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

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
			{searchable ? (
				<TableHeadSearchable
					headers={headers}
					tab={tab}
					reverse={reverse}
					tabOnChange={handleTabOnChange}
					actionCol
					searchPlaceholder="Search by address, comment, chain or state"
					searchValue={searchQuery}
					onSearchChange={setSearchQuery}
					hideMyWallet
					inMyWallet={false}
					onInMyWalletChange={() => {}}
					filterOptionsTitle="State"
					filterOptions={STATE_OPTIONS}
					activeFilters={activeStates}
					onFiltersChange={setActiveStates}
					customCategories={chainOptions}
					customCategoriesTitle="Chain"
					activeCustomCategories={activeChains}
					onCustomCategoriesChange={setActiveChains}
				/>
			) : (
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			)}
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>{searchable && minters.length > 0 ? "No modules match your search." : "There are no proposals yet."}</TableRowEmpty>
				) : (
					list.map((m, idx) => (
						<GovernanceMintersRow
							key={`${m.chainId}:${m.minter}` || `GovernanceMintersRow_${idx}`}
							headers={headers}
							tab={tab}
							minter={m}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortMinters = {
	minters: MinterQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortMinters(params: SortMinters): MinterQuery[] {
	const { minters, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		minters.sort((a, b) => b.applyDate - a.applyDate);
	} else if (tab === headers[1]) {
		minters.sort((a, b) => a.minter.localeCompare(b.minter));
	} else if (tab === headers[2]) {
		minters.sort((a, b) => b.chainId - a.chainId);
	} else if (tab === headers[3]) {
		minters.sort((a, b) => a.applyMessage.localeCompare(b.applyMessage));
	} else if (tab === headers[4]) {
		minters.sort((a, b) => b.applyDate - a.applyDate);
		minters.sort((a, b) => {
			return minterState(b) - minterState(a);
		});
	}

	return reverse ? minters.reverse() : minters;
}
