import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { Address, isAddress } from "viem";
import TransferActionCreate from "./TransferActionCreate";
import { useAccount, useBlockNumber } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { readContract } from "wagmi/actions";
import { ADDRESS, FrankencoinABI, TransferReferenceABI } from "@frankencoin/zchf";
import { useRouter } from "next/router";
import AddressInputChain from "@components/Input/AddressInputChain";
import { mainnet } from "viem/chains";

export default function TransferInteractionCard() {
	const router = useRouter();

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const [chain, setChain] = useState<string>(WAGMI_CHAIN.name);
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
				address: ADDRESS[mainnet.id].frankencoin,
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

	const errorAmount = () => {
		if (amount > balance) return `Not enough ZCHF in your wallet.`;
		else return "";
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
	};

	const isDisabled = !isAddress(recipient) || reference.length == 0 || amount == 0n || errorAmount() != "";

	return (
		<div className="md:mt-8">
			<section className="mx-auto max-w-2xl sm:px-8">
				<AppCard>
					<div className="mt-4 text-lg font-bold text-center">Transfer Parameters</div>

					<AddressInputChain
						label="Recipient"
						placeholder="0x1a2b3c..."
						value={recipient}
						onChange={setRecipient}
						error={errorRecipient()}
						chain={chain}
						chainOnChange={setChain}
					/>

					<AddressInput label="Reference" placeholder="Invoice 123" value={reference} onChange={setReference} isTextLeft={true} />

					<TokenInput
						symbol="ZCHF"
						label="Amount"
						chain={chain}
						value={amount.toString()}
						digit={18}
						onChange={onChangeAmount}
						max={balance}
						reset={0n}
						limit={balance}
						limitDigit={18}
						limitLabel="Balance"
						error={errorAmount()}
					/>

					<TransferActionCreate
						chain={chain}
						recipient={recipient as Address}
						reference={reference}
						amount={amount}
						disabled={isDisabled}
						setLoaded={setLoaded}
					/>
				</AppCard>
			</section>
		</div>
	);
}
