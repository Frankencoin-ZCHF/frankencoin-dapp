import { ExpandablePanel } from "../ExpandablePanel";
import { useTranslation } from "next-i18next";
import TableHeader from "../Table/TableHead";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useState } from "react";
import { Hash } from "viem/_types/types/misc";
import { TxLabelSimple } from "@components/AddressLabel";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";

interface TransactionHistoryData {
	id: string;
	created: number;
	type: string;
	rate: number;
	amount: string;
	txHash: string;
}

const HystoryRow = ({ item }: { item: TransactionHistoryData }) => {
	const dateArr: string[] = new Date(item.created * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<>
			<TxLabelSimple className="text-left font-medium text-sm/5" label={dateStr} tx={item.txHash as Hash} showLink />
			<div className="text-right font-medium text-sm/5">{item.type}</div>
			<div className="text-right font-medium text-sm/5">{formatCurrency(item.rate / 10_000)} %</div>
			<div className="text-right font-medium text-sm/5">{formatCurrency(formatUnits(BigInt(item.amount), 18))}</div>
		</>
	);
};

export function TransactionHistoryPanel() {
	const { t } = useTranslation();
	const headers: string[] = ["Date", "Type", "Rate", "Amount, dEURO"];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const { withdraw, save, interest } = useSelector((state: RootState) => state.savings.savingsUserTable);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	const sorted = sortTransactionHistory({
		transactionHistory: [
			...withdraw.map((r) => ({ ...r, type: t("savings.withdraw"), id: `withdraw-${r.txHash}` })),
			...save.map((r) => ({ ...r, type: t("savings.deposit"), id: `deposit-${r.txHash}` })),
			...interest.map((r) => ({ ...r, type: t("savings.claimed_interest"), id: `interest-${r.txHash}` })),
		],
		headers,
		tab,
		reverse,
	});

	return (
		<ExpandablePanel title={t("savings.transaction_history")}>
			{sorted.length > 0 ? (
				<>
					<TableHeader
						className="!py-2 !px-0 bg-transparent"
						headers={headers}
						tab={tab}
						reverse={reverse}
						tabOnChange={handleTabOnChange}
					/>
					<div className="w-full grid grid-cols-4 gap-y-2">
						{sorted.map((r) => (
							<HystoryRow key={r.id} item={r} />
						))}
					</div>
				</>
			) : (
				<div className="mt-2 font-medium text-base/5 text-text-muted">{t("savings.no_savings_yet")}</div>
			)}
		</ExpandablePanel>
	);
}

function sortTransactionHistory(params: {
	transactionHistory: TransactionHistoryData[];
	headers: string[];
	tab: string;
	reverse: boolean;
}): TransactionHistoryData[] {
	const { transactionHistory, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		transactionHistory.sort((a, b) => a.created - b.created);
	} else if (tab === headers[1]) {
		transactionHistory.sort((a, b) => a.type.localeCompare(b.type));
	} else if (tab === headers[2]) {
		transactionHistory.sort((a, b) => a.rate - b.rate);
	} else if (tab === headers[3]) {
		transactionHistory.sort((a, b) => Number(b.amount) - Number(a.amount));
	}

	return reverse ? transactionHistory.reverse() : transactionHistory;
}
