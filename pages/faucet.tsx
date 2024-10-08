import Head from "next/head";
import AppPageHeader from "@components/AppPageHeader";
import DisplayAmount from "@components/DisplayAmount";
import { useAccount } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useFaucetStats } from "@hooks";
import Button from "@components/Button";
import { ABIS } from "@contracts";
import { useState } from "react";
import { Address, parseUnits, zeroAddress } from "viem";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import Table from "@components/Table";
import TableHeader from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRow from "@components/Table/TableRow";
import TokenLogo from "@components/TokenLogo";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../app.config";
import { sepolia } from "viem/chains";

interface RowProps {
	addr: Address;
	name: string;
	symbol: string;
	balance: bigint;
	decimal: bigint;
}

export function FaucetRow({ name, symbol, balance, decimal, addr }: RowProps) {
	const { address } = useAccount();
	const account = address || zeroAddress;
	const [isConfirming, setIsConfirming] = useState(false);

	const handleFaucet = async () => {
		const mintWriteHash = await writeContract(WAGMI_CONFIG, {
			address: addr,
			abi: ABIS.MockVolABI,
			functionName: "mint",
			args: [account, parseUnits("1000", Number(decimal))],
		});

		const toastContent = [
			{
				title: "Amount:",
				value: "1000 " + symbol,
			},
			{
				title: "Transaction:",
				hash: mintWriteHash,
			},
		];

		const mintWriteState = await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: mintWriteHash, confirmations: 1 }), {
			pending: {
				render: <TxToast title={`Fauceting ${symbol}`} rows={toastContent} />,
			},
			success: {
				render: <TxToast title={`Successfully Fauceted ${symbol}`} rows={toastContent} />,
			},
			error: {
				render(error: any) {
					return renderErrorToast(error);
				},
			},
		});
	};

	return (
		<TableRow
			colSpan={6}
			actionCol={
				<Button isLoading={isConfirming} onClick={() => handleFaucet()}>
					+1000 {symbol}
				</Button>
			}
		>
			<div className="col-span-3">
				<div className="text-gray-400 md:hidden">Token</div>
				<div className="flex items-center">
					<TokenLogo currency={symbol} size={10} />
					<div>
						<div className="ml-2">{name}</div>
						<span className="ml-2 font-bold">{symbol}</span>
					</div>
				</div>
			</div>
			<div>
				<div className="text-gray-400 md:hidden">Decimals</div>
				{decimal.toString()}
			</div>
			<div>
				<div className="text-gray-400 md:hidden">Your Balance</div>
				<DisplayAmount amount={balance} digits={decimal} currency={symbol} hideLogo address={addr} />
			</div>
		</TableRow>
	);
}

export default function Faucet() {
	const faucetStats = useFaucetStats();

	return (
		<>
			<Head>
				<title>Frankencoin - Faucet</title>
			</Head>
			<div>
				<AppPageHeader title={`Faucets - Chain: ${WAGMI_CHAIN.name} (id: ${WAGMI_CHAIN.id})`} />
				<Table>
					<TableHeader headers={["Token", "", "", "Decimals", "Your Balance"]} actionCol colSpan={6} />
					<TableBody>
						{Object.keys(faucetStats).map((key) => (
							<FaucetRow
								key={key}
								addr={faucetStats[key].address}
								name={faucetStats[key].name}
								symbol={faucetStats[key].symbol}
								decimal={faucetStats[key].decimals}
								balance={faucetStats[key].balance}
							/>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
