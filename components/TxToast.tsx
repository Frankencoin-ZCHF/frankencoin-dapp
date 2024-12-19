import Link from "next/link";
import { shortenHash, transactionLink } from "@utils";
import { Hash } from "viem";
import { WAGMI_CHAIN } from "../app.config";

export const renderErrorToast = (error: string | string[]) => {
	error = typeof error == "string" ? [error] : error;
	return (
		<TxToast
			title="Transaction Failed!"
			rows={error.map((e) => {
				return { title: e };
			})}
		/>
	);
};

export const renderErrorTxToast = (error: any) => {
	const errorLines: string[] = error.message.split("\n");
	return renderErrorTxStackToast(error, 2);
};
export const renderErrorTxStackToast = (error: any, limit: number) => {
	const errorLines: string[] = error.message.split("\n");
	return (
		<TxToast
			title="Transaction Failed!"
			rows={errorLines.slice(0, limit == 0 ? errorLines.length : limit).map((line) => {
				return {
					title: "",
					value: line,
				};
			})}
		/>
	);
};

export const TxToast = (props: {
	title: string;
	rows: { title: string; value?: string | JSX.Element; hash?: Hash }[];
	success?: boolean;
}) => {
	const { title, rows, success = true } = props;
	const chain = WAGMI_CHAIN;
	let reasonLine: number;

	return (
		<div className="flex flex-col text-text-primary">
			<div className="font-bold mb-2">{title}</div>
			{rows.map((row, i) => {
				if (row.value?.toString().includes("with the following reason")) reasonLine = i + 1;
				return (
					<div className="flex items-center gap-1 justify-between text-sm" style={{ minHeight: 8 }} key={row.title}>
						{row.title && <div>{row.title}</div>}
						{row.hash ? (
							<Link
								href={transactionLink(chain?.blockExplorers?.default.url, row.hash)}
								target="_blank"
								className="text-link"
							>
								{shortenHash(row.hash)}
							</Link>
						) : (
							<div className={i == reasonLine ? "font-bold uppercase" : ""}>{row.value}</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
