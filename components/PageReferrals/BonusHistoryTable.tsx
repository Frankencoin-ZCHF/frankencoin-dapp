import { shortenAddress, shortenHash, TxUrl } from "@utils";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeader from "../Table/TableHead";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { TableShowMoreRow } from "@components/Table/TableShowMoreRow";

interface BonusData {
	payout: string;
	source: string;
	date: string;
	txId: string;
}

interface Props {
	data: BonusData[];
}

const headers = ["Payout", "Source", "Date", "TX-ID"];
const subHeaders = ["dEURO", "", "", ""];

export default function BonusHistoryTable({ data }: Props) {
	const [isShowMore, setIsShowMore] = useState(false);
	const [tab, setTab] = useState<string>(headers[0]);
	const [reverse, setReverse] = useState<boolean>(false);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	return (
		<div className="flex flex-col gap-2 sm:gap-6">
			<div className="text-xl sm:text-2xl font-black leading-relaxed">Bonus History</div>
			<Table>
				<TableHeader headers={headers} subHeaders={subHeaders} tab={tab} tabOnChange={handleTabOnChange} reverse={reverse} />
				<TableBody>
					<>
						{data.length === 0 ? (
							<TableRowEmpty>You do not have any bonus history yet.</TableRowEmpty>
						) : (
							data.slice(0, isShowMore ? data.length : 3).map((row, i) => (
								<TableRow key={i} headers={headers}>
									<div className="text-base font-medium leading-tight text-left">{row.payout}</div>
									<div className="text-base font-medium leading-tight">{row.source}</div>
									<div className="text-base font-medium leading-tight">{row.date}</div>
									<div>
										<Link href={TxUrl(row.txId as `0x${string}`)} className="text-base font-medium leading-tight">
											<span className="underline">{shortenHash(row.txId as `0x${string}`)}</span>
											<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
										</Link>
									</div>
								</TableRow>
							))
						)}
						{data.length > 3 && (
							<TableShowMoreRow onShowMoreClick={() => setIsShowMore(!isShowMore)}>
								<div className="text-table-header-active text-base font-black leading-normal tracking-tight">
									{isShowMore ? "show less" : "show more"}
								</div>
								<div className="justify-start items-center gap-2.5 flex">
									<FontAwesomeIcon icon={isShowMore ? faMinus : faPlus} className="w-4 h-4 text-table-header-active" />
								</div>
							</TableShowMoreRow>
						)}
					</>
				</TableBody>
			</Table>
		</div>
	);
}
