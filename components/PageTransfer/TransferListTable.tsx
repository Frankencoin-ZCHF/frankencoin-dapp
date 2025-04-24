import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import TransferListRow from "./TransferListRow";
import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import DateInput from "@components/Input/DateInput";
import { Address, isAddress } from "viem";
import { useAccount } from "wagmi";

{
	/* From, To, Ref, Start, End, History */
}

export default function TransferListTable() {
	const headers: string[] = ["Date", "Sender", "Recipient", "Amount", "Reference"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<[]>([]);

	const { address } = useAccount();
	const [sender, setSender] = useState<Address | string>(address || "");
	const [recipient, setRecipient] = useState<Address | string>("");
	const [reference, setReference] = useState<string>("");

	// const sorted: SavingsInterestQuery[] = sortFunction({ list: interest, headers, tab, reverse });

	// useEffect(() => {
	// 	const idList = list.map((l) => l.id).join("_");
	// 	const idSorted = sorted.map((l) => l.id).join("_");
	// 	if (idList != idSorted) setList(sorted);
	// }, [list, sorted]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	const errorSender = () => {
		if (sender == "" || isAddress(sender)) return "";
		else return "Invalid sender address";
	};

	const errorRecipient = () => {
		if (recipient == "" || isAddress(recipient)) return "";
		else return "Invalid recipient address";
	};

	return (
		<div className="grid gap-4">
			<AppCard>
				<div className="grid md:grid-cols-2 gap-4">
					<div className="">
						<AddressInput
							label="Sender"
							placeholder="Enter sender address here"
							value={sender}
							onChange={setSender}
							error={errorSender()}
						/>
						<AddressInput
							label="Recipient"
							placeholder="Enter recipient address here"
							value={recipient}
							onChange={setRecipient}
							error={errorRecipient()}
						/>
						<AddressInput
							label="Reference"
							placeholder="Enter reference comment here"
							value={reference}
							onChange={setReference}
						/>
					</div>
					<div className="">
						<DateInput label="Start" value={new Date("2025-01-01")} />
						<DateInput label="End" value={new Date()} />
					</div>
				</div>
			</AppCard>

			<Table>
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
				<TableBody>
					{list.length == 0 ? (
						<TableRowEmpty>{"No transfer references found..."}</TableRowEmpty>
					) : (
						list.map((r, idx) => <TransferListRow headers={headers} tab={tab} key={r} item={r} />)
					)}
				</TableBody>
			</Table>
		</div>
	);
}

// type SortFunctionParams = {
// 	list: SavingsInterestQuery[];
// 	headers: string[];
// 	tab: string;
// 	reverse: boolean;
// };

// function sortFunction(params: SortFunctionParams): SavingsInterestQuery[] {
// 	const { list, headers, tab, reverse } = params;
// 	let sortingList = [...list]; // make it writeable

// 	if (tab === headers[0]) {
// 		// Date
// 		sortingList.sort((a, b) => b.created - a.created);
// 	} else if (tab === headers[1]) {
// 		// Saver
// 		sortingList.sort((a, b) => a.account.localeCompare(b.account));
// 	} else if (tab === headers[2]) {
// 		// Interest / Amount
// 		sortingList.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
// 	} else if (tab === headers[3]) {
// 		// Balance
// 		sortingList.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
// 	}

// 	return reverse ? sortingList.reverse() : sortingList;
// }
