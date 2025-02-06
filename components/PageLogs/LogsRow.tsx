import { Address, formatUnits, Hash, parseEther, parseUnits } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency } from "../../utils/format";
import { AnalyticsTransactionLog, PositionQueryV2 } from "@frankencoin/api";
import Button from "@components/Button";
import AppBox from "@components/AppBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useTxUrl } from "@hooks";

interface Props {
	headers: string[];
	tab: string;
	log: AnalyticsTransactionLog;
}

export default function LogsRow({ headers, tab, log }: Props) {
	const link = useTxUrl(log.txHash as Hash);
	const dateArr = new Date(parseInt(log.timestamp) * 1000).toLocaleString().split(", ");
	const kindArr = log.kind.split(":");

	const equityRatio = (BigInt(log.totalEquity) * parseEther("1")) / BigInt(log.totalSupply);
	const savingsRatio = (BigInt(log.totalSavings) * parseEther("1")) / BigInt(log.totalSupply);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<TableRow headers={headers} tab={tab}>
			<div className="cursor-pointer underline md:text-left max-md:text-right" onClick={openExplorer}>
				<div>
					{dateArr[0]}
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 cursor-pointer" />
				</div>
				<div>{dateArr[1]}</div>
			</div>
			<div>
				<div>{kindArr[0]}</div>
				<div>{kindArr[1]}</div>
			</div>
			<div>{formatCurrency(formatUnits(log.amount, 18))}</div>

			{/* totals */}
			<div>{formatCurrency(formatUnits(log.totalSupply, 18 + 6))}M</div>
			<div>{formatCurrency(formatUnits(equityRatio, 18 - 2))}%</div>
			<div>{formatCurrency(formatUnits(savingsRatio, 18 - 2))}%</div>

			{/* FPS */}
			<div>{formatCurrency(formatUnits(log.fpsPrice, 18))}</div>
			<div>{formatCurrency(formatUnits(log.fpsTotalSupply, 18 + 3))}k</div>

			{/* analytics */}
			<div>{formatCurrency(formatUnits(log.annualNetEarnings, 18 + 6))}M</div>
			<div>{formatCurrency(formatUnits(log.earningsPerFPS, 18))}</div>
		</TableRow>
	);
}
