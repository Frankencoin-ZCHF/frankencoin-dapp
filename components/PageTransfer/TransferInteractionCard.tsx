import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import { formatCurrency } from "@utils";
import { useEffect, useState } from "react";
import { Address, formatUnits, isAddress } from "viem";
import TransferActionCreate from "./TransferActionCreate";
import { useAccount, useBlockNumber } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { readContract } from "wagmi/actions";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";
import { useRouter } from "next/router";

export default function TransferInteractionCard() {
	const router = useRouter();

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const [balance, setBalance] = useState<bigint>(0n);
	const [recipient, setRecipient] = useState<string>((router.query.recipient as string) ?? "");
	const [reference, setReference] = useState<string>((router.query.reference as string) ?? "");
	const [amount, setAmount] = useState<bigint>(BigInt((router.query.amount as string) ?? "0"));
	const [isLoaded, setLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (isLoaded) {
			setReference("");
			setAmount(0n);
			setLoaded(false);
		}
	}, [isLoaded]);

	useEffect(() => {
		if (address == undefined) return;

		const fetcher = async () => {
			const _bal = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].frankenCoin,
				abi: FrankencoinABI,
				functionName: "balanceOf",
				args: [address],
			});
			setBalance(_bal);
		};

		fetcher();
	}, [address, data]);

	const errorRecipient = () => {
		if (recipient != "" && !isAddress(recipient)) return "Invalid recipient address";
		else return "";
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
	};

	const isDisabled = !isAddress(recipient) || reference.length == 0 || amount == 0n;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Make a Transfer</div>

				<AddressInput
					label="Recipient"
					placeholder="Enter recipient address here"
					value={recipient}
					onChange={setRecipient}
					error={errorRecipient()}
				/>

				<AddressInput label="Reference" placeholder="Enter reference comment here" value={reference} onChange={setReference} />

				<TokenInput symbol="ZCHF" label="Amount" value={amount.toString()} digit={18} onChange={onChangeAmount} />

				<TransferActionCreate
					recipient={recipient as Address}
					reference={reference}
					amount={amount}
					disabled={isDisabled}
					setLoaded={setLoaded}
				/>
			</AppCard>

			<AppCard>
				<div className="text-lg font-bold text-center">Outcome</div>
				<div className="p-4 flex flex-col gap-2">
					<div className="flex">
						<div className="flex-1 text-text-secondary">Your current balance</div>
						<div className="">{formatCurrency(formatUnits(balance, 18))} ZCHF</div>
					</div>

					<div className="flex">
						<div className="flex-1 text-text-secondary">Amount for transfer</div>
						<div className="">{formatCurrency(formatUnits(-amount, 18))} ZCHF</div>
					</div>

					<hr className="border-slate-700 border-dashed" />

					<div className="flex font-bold">
						<div className="flex-1 text-text-secondary">Resulting balance</div>
						<div className="">{formatCurrency(formatUnits(balance - amount, 18))} ZCHF</div>
					</div>

					<div className="flex mt-8">
						<div className={`flex-1 text-text-secondary`}>How does it work? ...</div>
					</div>
				</div>
			</AppCard>
		</div>
	);
}
