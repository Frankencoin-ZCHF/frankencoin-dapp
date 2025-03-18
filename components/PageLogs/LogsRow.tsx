import { formatUnits, Hash, parseEther } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency } from "../../utils/format";
import { AnalyticsTransactionLog } from "@frankencoin/api";
import { useTxUrl } from "@hooks";
import { TxUrl } from "@utils";
import AppLink from "@components/AppLink";

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
				<AppLink className="" label={dateArr[0] + " " + dateArr[1]} href={TxUrl(log.txHash as Hash)} external={true} />
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
			<div>{formatCurrency(formatUnits(log.realizedNetEarnings, 18 + 6))}M</div>
			<div>{formatCurrency(formatUnits(log.annualNetEarnings, 18 + 6))}M</div>
			<div>{formatCurrency(formatUnits(log.earningsPerFPS, 18))}</div>
		</TableRow>
	);
}
