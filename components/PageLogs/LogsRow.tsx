import { Address, formatUnits, parseEther, parseUnits } from "viem";
import TableRow from "../Table/TableRow";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { useRouter as useNavigation } from "next/navigation";
import { formatCurrency } from "../../utils/format";
import { AnalyticsTransactionLog, PositionQueryV2 } from "@frankencoin/api";
import Button from "@components/Button";
import AppBox from "@components/AppBox";

interface Props {
	headers: string[];
	tab: string;
	log: AnalyticsTransactionLog;
}

export default function LogsRow({ headers, tab, log }: Props) {
	const dateArr = new Date(parseInt(log.timestamp) * 1000).toLocaleString().split(", ");
	const kindArr = log.kind.split(":");

	const equityRatio = (BigInt(log.totalEquity) * parseEther("1")) / BigInt(log.totalSupply);
	const savingsRatio = (BigInt(log.totalSavings) * parseEther("1")) / BigInt(log.totalSupply);

	return (
		<TableRow headers={headers} tab={tab}>
			<div className="md:text-left max-md:text-right">
				<div>{dateArr[0]}</div>
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
