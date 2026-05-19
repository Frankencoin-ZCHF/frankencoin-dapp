import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeader from "../Table/TableHead";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import GovernanceCCIPAdminRow from "./GovernanceCCIPAdminRow";

const STATUS_OPTIONS = ["All", "Pending", "Enacted", "Denied"];

export default function GovernanceCCIPAdminTable() {
	const proposals = useSelector((state: RootState) => state.bridge.proposals);
	const loaded = useSelector((state: RootState) => state.bridge.loaded);

	const headers = ["Date", "Proposer", "Chain", "Type", "Status"];
	const [tab, setTab] = useState(headers[0]);
	const [reverse, setReverse] = useState(false);
	const [statusFilter, setStatusFilter] = useState("All");

	const handleTabOnChange = (e: string) => {
		if (tab === e) setReverse(!reverse);
		else {
			setReverse(false);
			setTab(e);
		}
	};

	const sorted = useMemo(() => {
		const filtered = statusFilter === "All" ? proposals : proposals.filter((p) => p.status === statusFilter);
		return [...filtered].sort((a, b) => {
			let cmp = 0;
			if (tab === "Date") cmp = a.created - b.created;
			else if (tab === "Chain") cmp = a.chainId - b.chainId;
			else if (tab === "Type") cmp = (a.type ?? "").localeCompare(b.type ?? "");
			else if (tab === "Status") cmp = a.status.localeCompare(b.status);
			return reverse ? -cmp : cmp;
		});
	}, [proposals, tab, reverse, statusFilter]);

	return (
		<Table>
			<div className="rounded-t-lg bg-table-header-primary">
				<div className="flex flex-wrap items-center gap-2 px-8 xl:px-12 py-3 border-b border-table-header-secondary">
					<div className="flex items-center gap-2 ml-auto">
						<span className="text-sm font-semibold text-text-secondary">Status</span>
						<div className="flex gap-1">
							{STATUS_OPTIONS.map((s) => (
								<button
									key={s}
									onClick={() => setStatusFilter(s)}
									className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
										statusFilter === s
											? "bg-button-default text-white"
											: "bg-white text-text-secondary border border-gray-200 hover:border-gray-400"
									}`}
								>
									{s}
								</button>
							))}
						</div>
					</div>
				</div>
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			</div>
			<TableBody>
				{sorted.length === 0 ? (
					<TableRowEmpty>{loaded ? "No proposals found." : "Loading..."}</TableRowEmpty>
				) : (
					sorted.map((p) => (
						<GovernanceCCIPAdminRow key={`${p.chainId}-${p.hash}`} headers={headers} tab={tab} proposal={p} />
					))
				)}
			</TableBody>
		</Table>
	);
}
