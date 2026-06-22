import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import AddressInput from "@components/Input/AddressInput";
import NormalInput from "@components/Input/NormalInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import PageTabInput from "@components/Input/PageTabInput";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { useState } from "react";
import { Address, isAddress } from "viem";
import { useConnection, useChainId } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";

const ERC4626_ABI = [
	{
		type: "function",
		name: "deposit",
		inputs: [
			{ name: "assets", type: "uint256" },
			{ name: "receiver", type: "address" },
		],
		outputs: [{ type: "uint256" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "mint",
		inputs: [
			{ name: "shares", type: "uint256" },
			{ name: "receiver", type: "address" },
		],
		outputs: [{ type: "uint256" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "withdraw",
		inputs: [
			{ name: "assets", type: "uint256" },
			{ name: "receiver", type: "address" },
			{ name: "owner", type: "address" },
		],
		outputs: [{ type: "uint256" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "redeem",
		inputs: [
			{ name: "shares", type: "uint256" },
			{ name: "receiver", type: "address" },
			{ name: "owner", type: "address" },
		],
		outputs: [{ type: "uint256" }],
		stateMutability: "nonpayable",
	},
] as const;

function useVaultWrite(fnName: "deposit" | "mint" | "withdraw" | "redeem") {
	const chainId = useChainId();
	const [isLoading, setLoading] = useState(false);

	const execute = async (vault: Address, args: readonly [bigint, Address] | readonly [bigint, Address, Address], label: string) => {
		try {
			setLoading(true);
			const hash = await writeContract(WAGMI_CONFIG, {
				address: vault,
				abi: ERC4626_ABI,
				functionName: fnName,
				args: args as any,
				chainId,
			});
			const toastContent = [{ title: "Transaction:", hash }];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash, confirmations: 1 }), {
				pending: { render: <TxToast title={`${label} pending...`} rows={toastContent} /> },
				success: { render: <TxToast title={`${label} successful`} rows={toastContent} /> },
			});
			return true;
		} catch (error) {
			toast.error(renderErrorTxToast(error));
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { isLoading, execute };
}

function DepositTab() {
	const { address } = useConnection();
	const [vault, setVault] = useState("");
	const [assets, setAssets] = useState("0");
	const [receiver, setReceiver] = useState("");
	const { isLoading, execute } = useVaultWrite("deposit");

	const vaultAddr = isAddress(vault) ? (vault as Address) : undefined;
	const receiverAddr = isAddress(receiver) ? (receiver as Address) : undefined;
	const isDisabled = !vaultAddr || !receiverAddr || assets === "0" || assets === "";

	const handleDeposit = async (e: any) => {
		e.preventDefault();
		if (!vaultAddr || !receiverAddr) return;
		if (await execute(vaultAddr, [BigInt(assets), receiverAddr], "Deposit")) {
			setAssets("0");
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Deposit underlying assets into the vault and receive shares in return.
			</div>
			<AddressInput label="Vault Address (ERC-4626)" placeholder="0x..." value={vault} onChange={setVault} isTextLeft />
			<NormalInput label="Assets (raw units)" symbol="assets" digit={0} value={assets} onChange={setAssets} />
			<AddressInput label="Receiver" placeholder="0x..." value={receiver} onChange={setReceiver} own={address} isTextLeft />
			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isLoading} onClick={handleDeposit}>
					Deposit
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

function MintTab() {
	const { address } = useConnection();
	const [vault, setVault] = useState("");
	const [shares, setShares] = useState("0");
	const [receiver, setReceiver] = useState("");
	const { isLoading, execute } = useVaultWrite("mint");

	const vaultAddr = isAddress(vault) ? (vault as Address) : undefined;
	const receiverAddr = isAddress(receiver) ? (receiver as Address) : undefined;
	const isDisabled = !vaultAddr || !receiverAddr || shares === "0" || shares === "";

	const handleMint = async (e: any) => {
		e.preventDefault();
		if (!vaultAddr || !receiverAddr) return;
		if (await execute(vaultAddr, [BigInt(shares), receiverAddr], "Mint")) {
			setShares("0");
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Mint an exact number of vault shares by depositing the required amount of underlying assets.
			</div>
			<AddressInput label="Vault Address (ERC-4626)" placeholder="0x..." value={vault} onChange={setVault} isTextLeft />
			<NormalInput label="Shares (raw units)" symbol="shares" digit={0} value={shares} onChange={setShares} />
			<AddressInput label="Receiver" placeholder="0x..." value={receiver} onChange={setReceiver} own={address} isTextLeft />
			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isLoading} onClick={handleMint}>
					Mint Shares
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

function WithdrawTab() {
	const { address } = useConnection();
	const [vault, setVault] = useState("");
	const [assets, setAssets] = useState("0");
	const [receiver, setReceiver] = useState("");
	const [owner, setOwner] = useState("");
	const { isLoading, execute } = useVaultWrite("withdraw");

	const vaultAddr = isAddress(vault) ? (vault as Address) : undefined;
	const receiverAddr = isAddress(receiver) ? (receiver as Address) : undefined;
	const ownerAddr = isAddress(owner) ? (owner as Address) : undefined;
	const isDisabled = !vaultAddr || !receiverAddr || !ownerAddr || assets === "0" || assets === "";

	const handleWithdraw = async (e: any) => {
		e.preventDefault();
		if (!vaultAddr || !receiverAddr || !ownerAddr) return;
		if (await execute(vaultAddr, [BigInt(assets), receiverAddr, ownerAddr], "Withdraw")) {
			setAssets("0");
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Withdraw an exact amount of underlying assets from the vault, burning the required shares from the owner.
			</div>
			<AddressInput label="Vault Address (ERC-4626)" placeholder="0x..." value={vault} onChange={setVault} isTextLeft />
			<NormalInput label="Assets (raw units)" symbol="assets" digit={0} value={assets} onChange={setAssets} />
			<AddressInput label="Receiver" placeholder="0x..." value={receiver} onChange={setReceiver} own={address} isTextLeft />
			<AddressInput label="Owner" placeholder="0x..." value={owner} onChange={setOwner} own={address} isTextLeft />
			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isLoading} onClick={handleWithdraw}>
					Withdraw
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

function RedeemTab() {
	const { address } = useConnection();
	const [vault, setVault] = useState("");
	const [shares, setShares] = useState("0");
	const [receiver, setReceiver] = useState("");
	const [owner, setOwner] = useState("");
	const { isLoading, execute } = useVaultWrite("redeem");

	const vaultAddr = isAddress(vault) ? (vault as Address) : undefined;
	const receiverAddr = isAddress(receiver) ? (receiver as Address) : undefined;
	const ownerAddr = isAddress(owner) ? (owner as Address) : undefined;
	const isDisabled = !vaultAddr || !receiverAddr || !ownerAddr || shares === "0" || shares === "";

	const handleRedeem = async (e: any) => {
		e.preventDefault();
		if (!vaultAddr || !receiverAddr || !ownerAddr) return;
		if (await execute(vaultAddr, [BigInt(shares), receiverAddr, ownerAddr], "Redeem")) {
			setShares("0");
		}
	};

	return (
		<AppCard>
			<div className="text-text-secondary text-sm">
				Redeem an exact number of vault shares and receive the underlying assets from the owner.
			</div>
			<AddressInput label="Vault Address (ERC-4626)" placeholder="0x..." value={vault} onChange={setVault} isTextLeft />
			<NormalInput label="Shares (raw units)" symbol="shares" digit={0} value={shares} onChange={setShares} />
			<AddressInput label="Receiver" placeholder="0x..." value={receiver} onChange={setReceiver} own={address} isTextLeft />
			<AddressInput label="Owner" placeholder="0x..." value={owner} onChange={setOwner} own={address} isTextLeft />
			<GuardSupportedChain>
				<AppButton disabled={isDisabled} isLoading={isLoading} onClick={handleRedeem}>
					Redeem Shares
				</AppButton>
			</GuardSupportedChain>
		</AppCard>
	);
}

export default function Erc4626Page() {
	return (
		<>
			<Head>
				<title>Frankencoin - ERC-4626 Vault Tools</title>
			</Head>

			<AppTitle title="ERC-4626 Vault Tools">
				<div className="text-text-secondary">
					Interact with any tokenized vault — deposit assets, mint shares, or withdraw and redeem from any ERC-4626 vault.
				</div>
			</AppTitle>

			<PageTabInput
				tabs={[
					{ label: "Deposit", slug: "deposit", content: <DepositTab /> },
					{ label: "Mint", slug: "mint", content: <MintTab /> },
					{ label: "Withdraw", slug: "withdraw", content: <WithdrawTab /> },
					{ label: "Redeem", slug: "redeem", content: <RedeemTab /> },
				]}
			/>
		</>
	);
}
