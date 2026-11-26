import Link from "next/link";
import { getChain, shortenHash, transactionLink } from "@utils";
import { Abi, decodeErrorResult, Hash } from "viem";
import { useChainId } from "wagmi";
import { ChainId } from "@frankencoin/zchf";

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
	return renderErrorTxStackToast(error, 2);
};

export const renderErrorTxToastDecode = (error: any, abi: Abi, stackLimit: number = 2) => {
	const errorLines: string[] = error.message.split("\n");
	// viem keeps the complete revert data on the error. The message only carries the selector, which does not suffice to
	// decode errors with arguments, and not even that if the error is part of the abi of the call.
	const revertData: string | undefined = error.walk?.((e: any) => typeof e?.raw == "string" && e.raw.length >= 10)?.raw;
	// Error(string) of a require statement and Panic(uint256) are not custom errors, their message already reads well
	const isBuiltIn = ["0x08c379a0", "0x4e487b71"].includes(revertData?.slice(0, 10).toLowerCase() ?? "");
	const errorSignature = revertData && !isBuiltIn ? revertData : errorLines[1];

	if (typeof errorSignature == "string" && errorSignature.slice(0, 2) == "0x") {
		try {
			const customError = decodeErrorResult({
				abi,
				data: errorSignature as `0x${string}`,
			});

			return <TxToast title="Transaction Failed!" rows={[{ title: customError.errorName, value: customError.args?.join("\n") }]} />;
		} catch (decodeError) {
			// not an error of the given abi, show what we got
			return renderErrorTxStackToast(error, stackLimit);
		}
	} else {
		return renderErrorTxStackToast(error, stackLimit);
	}
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

// Toast row linking a cross-chain transaction to the Chainlink CCIP explorer, which tracks delivery on the destination chain
export const ccipToastRow = (hash: Hash) => ({
	title: "CCIP Status: ",
	value: (
		<Link href={`https://ccip.chain.link/tx/${hash}`} target="_blank" className="text-link">
			Track
		</Link>
	),
});

export const TxToast = (props: {
	title: string;
	rows: { title: string; value?: string | JSX.Element; hash?: Hash }[];
	success?: boolean;
	/** Chain the transaction was sent on; defaults to the currently connected chain. Pass it when the wallet can switch chains while the toast is open. */
	chainId?: ChainId;
}) => {
	const { title, rows, success = true } = props;
	const connectedChainId = useChainId() as ChainId;
	// uses the viem default block explorer of the chain, so links match the chain the transaction was sent on
	const chain = getChain(props.chainId ?? connectedChainId);
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
