import AppCard from "@components/AppCard";
import AddressInput from "@components/Input/AddressInput";
import TokenInput from "@components/Input/TokenInput";
import { useEffect, useState } from "react";
import { Address, isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { WAGMI_CHAIN, WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, BridgedFrankencoinABI, ChainId, ChainIdSide } from "@frankencoin/zchf";
import { useRouter } from "next/router";
import AddressInputChain from "@components/Input/AddressInputChain";
import { mainnet } from "viem/chains";
import TransferActionMainnet from "./TransferActionMainnet";
import TransferActionSidechain from "./TransferActionSidechain";
import { useUserBalance } from "../../hooks/useUserBalance";
import { readContract } from "wagmi/actions";
import TransferDetailsCard from "./TransferDetailsCard";
import { AppKitNetwork } from "@reown/appkit/networks";
import { useAppKitNetwork } from "@reown/appkit/react";

export default function TransferInteractionCard() {
	const router = useRouter();
	const chainId = useChainId();
	const { address } = useAccount();
	const AppKitNetwork = useAppKitNetwork();
	const chain = WAGMI_CHAINS.find((c) => c.id == chainId);
	const isMainnetChain = chainId == mainnet.id;

	const userBalance = useUserBalance();
	const balance = userBalance[chainId as ChainId].frankencoin;

	const [recipient, setRecipient] = useState<string>((router.query.recipient as string) ?? "");
	const [recipientChainName, setRecipientChainName] = useState<string>((router.query.chain as string) ?? WAGMI_CHAIN.name);
	const [recipientChain, setRecipientChain] = useState<AppKitNetwork>(WAGMI_CHAIN);

	const [refToggle, setRefToggle] = useState<boolean>(((router.query.reference as string) ?? "").length > 0);
	const [reference, setReference] = useState<string>((router.query.reference as string) ?? "");
	const [amount, setAmount] = useState<bigint>(BigInt((router.query.amount as string) ?? "0"));
	const [ccipFee, setCcipFee] = useState<bigint>(0n);
	const [isLoaded, setLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (isLoaded) {
			setReference("");
			setAmount(0n);
			setLoaded(false);
		}
	}, [isLoaded]);

	useEffect(() => {
		if (reference.length > 0 && !refToggle) setRefToggle(true);
		else if (reference.length == 0 && refToggle) setRefToggle(false);
	}, [reference, refToggle]);

	useEffect(() => {
		let targetChainToCheck = recipientChainName.toLowerCase();

		if (targetChainToCheck == "optimism") {
			targetChainToCheck = "OP Mainnet";
		} else if (targetChainToCheck == "arbitrum") {
			targetChainToCheck = "Arbitrum One";
		}

		const targetChain = WAGMI_CHAINS.find((c) => c.name.toLowerCase() == targetChainToCheck.toLowerCase());
		if (!targetChain) {
			setRecipientChain(WAGMI_CHAIN);
			setRecipientChainName(WAGMI_CHAIN.name);
			console.error("targetChain not found");
			return;
		} else {
			setRecipientChain(targetChain);
			setRecipientChainName(targetChain.name);
		}

		if (targetChain.id == chainId) {
			setCcipFee(0n);
			return;
		}

		const fetcher = async () => {
			if (isAddress(recipient) && targetChain) {
				const getCCIPFee = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
					abi: BridgedFrankencoinABI,
					functionName: "getCCIPFee",
					args: [BigInt(ADDRESS[targetChain.id as ChainIdSide].chainSelector), recipient, amount, true],
				});

				setCcipFee(getCCIPFee);
			}
		};

		fetcher();
	}, [amount, chainId, recipient, recipientChainName]);

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

	const onChangeChain = (value: string) => {
		const chain = WAGMI_CHAINS.find((c) => c.name == value) as AppKitNetwork;
		if (chain != undefined) AppKitNetwork.switchNetwork(chain);
	};

	const isDisabled = !isAddress(recipient) || (refToggle && reference.length == 0) || amount == 0n || errorAmount() != "";

	return (
		<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Transfer Parameters</div>

				<AddressInputChain label="Sender" disabled={true} value={address} chain={chain?.name} onChangeChain={onChangeChain} />

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

				<AddressInputChain
					label="Recipient"
					placeholder="0x1a2b3c..."
					value={recipient}
					onChange={setRecipient}
					own={address}
					error={errorRecipient()}
					chain={recipientChain?.name}
					onChangeChain={setRecipientChainName}
				/>

				<AddressInput
					label="Reference"
					placeholder="Invoice 123"
					value={reference}
					onChange={setReference}
					isTextLeft={true}
					reset=""
				/>

				{isMainnetChain ? (
					<TransferActionMainnet
						recipientChain={recipientChain}
						recipient={recipient as Address}
						ccipFee={ccipFee}
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
						ccipFee={ccipFee}
						recipient={recipient as Address}
						reference={reference}
						amount={amount}
						disabled={isDisabled}
						setLoaded={setLoaded}
					/>
				)}
			</AppCard>

			<TransferDetailsCard chain={chain} recipientChain={recipientChain} ccipFee={ccipFee} />
		</section>
	);
}
