import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useEffect, useState } from "react";
import TransferListRow from "./TransferListRow";
import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import DateInput from "@components/Input/DateInput";
import { Address, isAddress } from "viem";
import { useAccount } from "wagmi";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { TransferReferenceQuery } from "@frankencoin/api";

const RESET_DATE = new Date(new Date().getUTCFullYear().toString());

export default function TransferListTable() {
	const headers: string[] = ["Date", "Sender", "Recipient", "Amount", "Reference"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [fetchedList, setFetchedList] = useState<TransferReferenceQuery[]>([]);
	const [list, setList] = useState<TransferReferenceQuery[]>([]);

	const { address } = useAccount();
	const [sender, setSender] = useState<Address | string>(address || "");
	const [recipient, setRecipient] = useState<Address | string>("");
	const [reference, setReference] = useState<string>("");
	const [start, setStart] = useState<Date>(RESET_DATE);
	const [end, setEnd] = useState<Date | string>("Now");

	useEffect(() => {
		// guards
		if (sender.length == 0 && recipient.length == 0) return;
		if ((sender.length > 0 && !isAddress(sender)) || (recipient.length > 0 && !isAddress(recipient))) return;

		// at least the sender is known
		const fetcher = async () => {
			const params: Record<string, string | number> = {};

			if (recipient.length > 0) params.to = recipient;
			if (sender.length > 0) params.from = sender;

			if (reference.length > 0) params.ref = reference;
			if (typeof end != "string") params.end = end.toISOString();
			params.start = start.toISOString();

			const data = await FRANKENCOIN_API_CLIENT.get<TransferReferenceQuery[]>(
				`/transfer/reference/history/by/${sender.length > 0 ? "from" : "to"}/${sender.length > 0 ? sender : recipient}`,
				{
					params,
				}
			);

			setFetchedList(data.data);
		};

		fetcher();
	}, [sender, recipient, reference, start, end]);

	const sorted: TransferReferenceQuery[] = sortFunction({ list: fetchedList, headers, tab, reverse });

	useEffect(() => {
		const idList = list.map((l) => l.id).join("_");
		const idSorted = sorted.map((l) => l.id).join("_");
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
					<div className="flex flex-col justify-center">
						<DateInput label="Start" value={start} onChange={(d) => d && setStart(d)} reset={RESET_DATE} />
						<DateInput
							label="End"
							value={end === "Now" ? new Date() : (end as Date)}
							onChange={(d) => d && setEnd(d)}
							output={end === "Now" ? end : undefined}
							reset={end === "Now" ? undefined : new Date()}
							onReset={() => setEnd("Now")}
						/>
					</div>
				</div>
			</AppCard>

			<Table>
				<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
				<TableBody>
					{list.length == 0 ? (
						<TableRowEmpty>{"No transfer references found..."}</TableRowEmpty>
					) : (
						list.map((i, idx) => (
							<TransferListRow headers={headers} tab={tab} key={i.id ?? `TransferListRow_${idx}`} item={i} />
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

type SortFunctionParams = {
	list: TransferReferenceQuery[];
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortFunction(params: SortFunctionParams): TransferReferenceQuery[] {
	const { list, headers, tab, reverse } = params;
	let sortingList = [...list]; // make it writeable

	if (tab === headers[0]) {
		// Date
		sortingList.sort((a, b) => b.created - a.created);
	} else if (tab === headers[1]) {
		// Spender
		sortingList.sort((a, b) => a.from.localeCompare(b.from));
	} else if (tab === headers[2]) {
		// Recipient
		sortingList.sort((a, b) => parseInt(b.to) - parseInt(a.to));
	} else if (tab === headers[3]) {
		// Amount
		sortingList.sort((a, b) => parseInt(b.amount.toString()) - parseInt(a.amount.toString()));
	} else if (tab === headers[4]) {
		// Reference
		sortingList.sort((a, b) => a.ref.localeCompare(b.ref));
	}

	return reverse ? sortingList.reverse() : sortingList;
}
