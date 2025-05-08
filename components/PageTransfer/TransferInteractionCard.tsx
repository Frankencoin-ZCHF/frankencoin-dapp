import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import { formatCurrency } from "@utils";
import { useEffect, useState } from "react";
import { Address, formatUnits, isAddress, zeroAddress } from "viem";
import TransferActionCreate from "./TransferActionCreate";
import { useAccount, useBlockNumber } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { readContract } from "wagmi/actions";
import { ADDRESS, FrankencoinABI, ReferenceTransferABI, SavingsABI } from "@frankencoin/zchf";
import { useRouter } from "next/router";
import TransferActionAutoSave from "./TransferActionAutoSave";

export default function TransferInteractionCard() {
	const router = useRouter();

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const [balance, setBalance] = useState<bigint>(0n);
	const [autoSave, setAutoSave] = useState<string>("");
	const [autoSaveRate, setAutoSaveRate] = useState<{ savingsV2: number }>({ savingsV2: 0 });
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

			const _autoSave = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].referenceTransfer,
				abi: ReferenceTransferABI,
				functionName: "hasAutoSave",
				args: [address],
			});
			setAutoSave(_autoSave);
		};

		fetcher();
	}, [address, data]);

	useEffect(() => {
		const fetcher = async () => {
			const addr1 = ADDRESS[WAGMI_CHAIN.id].savings;
			// const addr2 = ADDRESS[WAGMI_CHAIN.id].savingsDetached;

			const rate1 = await readContract(WAGMI_CONFIG, {
				address: addr1,
				abi: SavingsABI,
				functionName: "currentRatePPM",
			});
			// const rate2 = await readContract(WAGMI_CONFIG, {
			// 	address: addr2,
			// 	abi: SavingsABI,
			// 	functionName: "currentRatePPM",
			// });

			setAutoSaveRate({
				savingsV2: rate1,
				// savingsDetached: rate2,
			});
		};

		fetcher();
	}, []);

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
				<div className="mt-4 text-lg font-bold text-center">Outcome</div>
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

					<div className="mt-8 text-lg font-bold text-center">Auto Saver</div>

					<div className="flex my-4">
						<div className={`flex-1 text-text-secondary`}>
							You can auto-save incoming funds directly into a savings module.{" "}
							{autoSave == ADDRESS[WAGMI_CHAIN.id].savings ? (
								<span className="font-bold">{`You currently auto-save at ${autoSaveRate.savingsV2 / 10_000}%`}</span>
							) : // ) : autoSave == ADDRESS[WAGMI_CHAIN.id].savingsDetached ? (
							// 	<span className="font-bold">{`You currently auto-save at ${autoSaveRate.savingsDetached / 10_000}%`}</span>
							null}
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<TransferActionAutoSave
							lable={`MintingHubV2 - ${autoSaveRate.savingsV2 / 10_000}%`}
							disabled={autoSave != zeroAddress && autoSave == ADDRESS[WAGMI_CHAIN.id].savings}
							target={ADDRESS[WAGMI_CHAIN.id].savings}
						/>

						{/* <TransferActionAutoSave
						lable={`Detached Module - ${autoSaveRate.savingsDetached / 10_000}%`}
						disabled={autoSave != zeroAddress && autoSave == ADDRESS[WAGMI_CHAIN.id].savingsDetached}
						target={ADDRESS[WAGMI_CHAIN.id].savingsDetached}
						/> */}

						<TransferActionAutoSave lable="Turn Off - 0%" disabled={autoSave == zeroAddress} target={zeroAddress} />
					</div>
				</div>
			</AppCard>
		</div>
	);
}
