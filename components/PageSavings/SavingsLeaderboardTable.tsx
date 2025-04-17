import { useSelector } from "react-redux";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import TableRow from "@components/Table/TableRow";
import { TOKEN_SYMBOL } from "@utils";
import { AddressLabelSimple } from "@components/AddressLabel";
import { formatUnits, Address } from "viem";
import { formatCurrency } from "@utils";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { RootState } from "../../redux/redux.store";
import { ApiSavingsUserLeaderboard } from "@deuro/api";
import { TableShowMoreRow } from "@components/Table/TableShowMoreRow";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
	headers: string[];
	item: ApiSavingsUserLeaderboard;
	tab: string;
}

function SavingsLeaderboardRow({ headers, item, tab }: Props) {
	return (
		<>
			<TableRow headers={headers} tab={tab}>
				<div className="flex flex-col text-left">
					<AddressLabelSimple address={item.account} showLink />
				</div>
				<div className={`flex flex-col`}>
					{formatCurrency(formatUnits(BigInt(item.unrealizedInterest), 18), 2, 2)} {TOKEN_SYMBOL}
				</div>
				<div className="flex flex-col">
					{formatCurrency(formatUnits(BigInt(item.interestReceived), 18), 2, 2)} {TOKEN_SYMBOL}
				</div>
				<div className="flex flex-col">
					{formatCurrency(formatUnits(BigInt(item.amountSaved), 18), 2, 2)} {TOKEN_SYMBOL}
				</div>
			</TableRow>
		</>
	);
}

export default function SavingsLeaderboardTable() {
	const { t } = useTranslation();
	const headers: string[] = [
		t("savings.saver"),
		t("savings.unrealized_interest"),
		t("savings.interest_received"),
		t("savings.total_saved"),
	];
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [isShowMore, setIsShowMore] = useState<boolean>(false);

	const leaderboard = useSelector((state: RootState) => state.savings.savingsLeaderboard);

	const sorted = sortSavingsLeaderboard({
		leaderboard,
		headers,
		tab,
		reverse,
	});

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
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} headerClassNames={["!text-left"]} />
			<TableBody>
				<>
					{sorted.length == 0 ? (
						<TableRowEmpty>{t("savings.no_withdrawals_yet")}</TableRowEmpty>
					) : (
						sorted
							.slice(0, isShowMore ? sorted.length : 7)
							.map((r) => <SavingsLeaderboardRow headers={headers} key={r.account} item={r} tab={tab} />)
					)}
					{sorted.length > 7 && (
						<TableShowMoreRow onShowMoreClick={() => setIsShowMore(!isShowMore)}>
							<div className="text-table-header-active text-base font-black leading-normal tracking-tight">
								{isShowMore ? t("referrals.show_less") : t("referrals.show_more")}
							</div>
							<div className="justify-start items-center gap-2.5 flex">
								<FontAwesomeIcon icon={isShowMore ? faMinus : faPlus} className="w-4 h-4 text-table-header-active" />
							</div>
						</TableShowMoreRow>
					)}
				</>
			</TableBody>
		</Table>
	);
}

function sortSavingsLeaderboard(params: {
	leaderboard: {
		account: Address;
		amountSaved: string;
		unrealizedInterest: string;
		interestReceived: string;
	}[];
	headers: string[];
	tab: string;
	reverse: boolean;
}): {
	account: Address;
	amountSaved: string;
	unrealizedInterest: string;
	interestReceived: string;
}[] {
	const { leaderboard, headers, tab, reverse } = params;
	const sortedLeaderboard = [...leaderboard];

	if (tab === headers[0]) {
		sortedLeaderboard.sort((a, b) => Number(b.amountSaved) - Number(a.amountSaved));
	} else if (tab === headers[1]) {
		sortedLeaderboard.sort((a, b) => Number(b.unrealizedInterest) - Number(a.unrealizedInterest));
	} else if (tab === headers[2]) {
		sortedLeaderboard.sort((a, b) => Number(b.interestReceived) - Number(a.interestReceived));
	} else if (tab === headers[3]) {
		sortedLeaderboard.sort((a, b) => Number(b.amountSaved) - Number(a.amountSaved));
	}

	return reverse ? sortedLeaderboard.reverse() : sortedLeaderboard;
}
