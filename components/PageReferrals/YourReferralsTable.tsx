import { ContractUrl, shortenAddress } from "@utils";
import Table from "../Table";
import TableBody from "../Table/TableBody";
import TableHeader from "../Table/TableHead";
import TableRow from "../Table/TableRow";
import TableRowEmpty from "../Table/TableRowEmpty";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faChevronDown, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface ReferralData {
	volume: string;
	date: string;
	address: string;
}

interface Props {
	data: ReferralData[];
}

export default function YourReferralsTable({ data }: Props) {
	const [isShowMore, setIsShowMore] = useState(false);

	const headers = ["Referral volumen", "Date", "Address"];
	const subHeaders = ["dEURO", "", ""];

	return (
		<div className="flex flex-col gap-4">
			<div className="text-2xl font-black leading-relaxed">Your referrals</div>
			<Table>
				<TableHeader headers={headers} subHeaders={subHeaders} />
				<TableBody isShowMoreAvailable={data.length > 3 && !isShowMore} onShowMoreClick={() => setIsShowMore(!isShowMore)}>
					{data.length === 0 ? (
						<TableRowEmpty>You do not have any referrals yet.</TableRowEmpty>
					) : (
						data.slice(0, isShowMore ? data.length : 3).map((row, i) => (
							<TableRow key={i} headers={headers}>
								<div className="text-base font-medium leading-tight text-left">{row.volume}</div>
								<div className="text-base font-medium leading-tight">{row.date}</div>
								<div>
									<Link href={ContractUrl(row.address as `0x${string}`)} className="text-base font-medium leading-tight">
										<span className="underline">{shortenAddress(row.address as `0x${string}`)}</span>
										<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
									</Link>
								</div>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
