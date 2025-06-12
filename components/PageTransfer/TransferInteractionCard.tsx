import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { Address, isAddress } from "viem";
import { useChainId } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CHAINS } from "../../app.config";
import { ChainId } from "@frankencoin/zchf";
import { useRouter } from "next/router";
import AddressInputChain from "@components/Input/AddressInputChain";
import { mainnet } from "viem/chains";
import TransferActionMainnet from "./TransferActionMainnet";
import TransferActionSidechain from "./TransferActionSidechain";
import { useUserBalance } from "../../hooks/useUserBalance";
import AppToggle from "@components/AppToggle";

export default function TransferInteractionCard() {
	const router = useRouter();
	const chainId = useChainId();
	const chain = WAGMI_CHAINS.find((c) => c.id == chainId);
	const isMainnetChain = chainId == mainnet.id;

	const userBalance = useUserBalance();
	const balance = userBalance[chainId as ChainId].frankencoin;

	const [recipient, setRecipient] = useState<string>((router.query.recipient as string) ?? "");
	const [recipientChain, setRecipientChain] = useState<string>((router.query.recipientChain as string) ?? WAGMI_CHAIN.name);
	const [refToggle, setRefToggle] = useState<boolean>(false);
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
						chain={recipientChain}
						chainOnChange={setRecipientChain}
					/>

					<TokenInput
						symbol="ZCHF"
						label="Amount"
						chain={chain?.name || WAGMI_CHAIN.name}
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

					<div className="">
						{refToggle ? (
							<AddressInput
								label="Reference"
								placeholder="Invoice 123"
								value={reference}
								onChange={setReference}
								isTextLeft={true}
							/>
						) : null}
						<AppToggle disabled={false} label="Add Reference" enabled={refToggle} onChange={setRefToggle} />
					</div>

					{isMainnetChain ? (
						<TransferActionMainnet
							recipientChain={recipientChain}
							recipient={recipient as Address}
							addReference={refToggle}
							reference={reference}
							amount={amount}
							disabled={isDisabled}
							setLoaded={setLoaded}
						/>
					) : (
						<TransferActionSidechain
							recipientChain={recipientChain}
							addReference={refToggle}
							recipient={recipient as Address}
							reference={reference}
							amount={amount}
							disabled={isDisabled}
							setLoaded={setLoaded}
						/>
					)}
				</AppCard>
			</section>
		</div>
	);
}
