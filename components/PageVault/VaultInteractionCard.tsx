import { useEffect, useState } from "react";
import { Address, erc20Abi, formatUnits, maxUint256, zeroAddress } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { useConnection, useChainId, useReadContracts } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { useAppKitNetwork } from "@reown/appkit/react";
import { AppKitNetwork } from "@reown/appkit/networks";
import { ADDRESS, ChainId } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import AppToggle from "@components/AppToggle";
import TokenInputChain from "@components/Input/TokenInputChain";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { decodeBigIntCall, formatCurrency, getChain } from "@utils";
import { track } from "@hooks";
import VaultDetailsCard from "./VaultDetailsCard";
import { ERC4626ABI } from "../../abis/ERC4626";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	viewAddress?: Address;
	isViewingOtherAddress?: boolean;
}

type VaultChainId = typeof mainnet.id | typeof optimism.id | typeof gnosis.id | typeof base.id;
const VAULT_CHAINS = [mainnet, optimism, gnosis, base];
const VAULT_CHAIN_NAMES = VAULT_CHAINS.map((c) => c.name);

export default function VaultInteractionCard({ viewAddress, isViewingOtherAddress }: Props) {
	const { address } = useConnection();
	const connectedChainId = useChainId() as ChainId;
	const appKitNetwork = useAppKitNetwork();

	const [selectedChainId, setSelectedChainId] = useState<VaultChainId>(mainnet.id);
	const [isUnwrap, setUnwrap] = useState(false);
	const [amount, setAmount] = useState(0n);
	const [isApproving, setApproving] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (VAULT_CHAINS.some((c) => c.id === connectedChainId)) {
			setSelectedChainId(connectedChainId as VaultChainId);
		}
	}, [connectedChainId]);

	useEffect(() => {
		setAmount(0n);
	}, [selectedChainId, isUnwrap, viewAddress]);

	const chain = getChain(selectedChainId);
	const vault = ADDRESS[selectedChainId].svZCHF;
	const zchf: Address =
		selectedChainId === mainnet.id ? ADDRESS[mainnet.id].frankencoin : ADDRESS[selectedChainId].ccipBridgedFrankencoin;

	const account = viewAddress ?? address ?? zeroAddress;

	const { data, refetch } = useReadContracts({
		contracts: [
			{ address: zchf, chainId: selectedChainId, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ address: vault, chainId: selectedChainId, abi: erc20Abi, functionName: "balanceOf", args: [account] },
			{ address: zchf, chainId: selectedChainId, abi: erc20Abi, functionName: "allowance", args: [account, vault] },
			{
				address: vault,
				chainId: selectedChainId,
				abi: ERC4626ABI,
				functionName: isUnwrap ? "previewRedeem" : "previewDeposit",
				args: [amount],
			},
			{ address: vault, chainId: selectedChainId, abi: ERC4626ABI, functionName: "convertToAssets", args: [10n ** 18n] },
		],
	});

	const zchfBalance = data ? decodeBigIntCall(data[0]) : 0n;
	const svZchfBalance = data ? decodeBigIntCall(data[1]) : 0n;
	const allowance = data ? decodeBigIntCall(data[2]) : 0n;
	const preview = data ? decodeBigIntCall(data[3]) : 0n;
	const exchangeRate = data ? decodeBigIntCall(data[4]) || 10n ** 18n : 10n ** 18n;
	const svZchfValue = (svZchfBalance * exchangeRate) / 10n ** 18n;

	const balance = isUnwrap ? svZchfBalance : zchfBalance;

	const errorAmount = () => {
		if (amount > balance) return isUnwrap ? "Not enough svZCHF in your wallet." : "Not enough ZCHF in your wallet.";
		return "";
	};

	const needsApproval = !isUnwrap && amount > 0n && allowance < amount;
	const disabled = !address || isViewingOtherAddress || amount === 0n || errorAmount() !== "";

	const onChangeChain = (value: string) => {
		const target = VAULT_CHAINS.find((c) => c.name === value);
		if (!target) return;
		setSelectedChainId(target.id as VaultChainId);
		appKitNetwork.switchNetwork(target as AppKitNetwork);
	};

	const onChangeAmount = (value: string) => {
		setAmount(value === "" ? 0n : BigInt(value));
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				chainId: selectedChainId,
				address: zchf,
				abi: erc20Abi,
				functionName: "approve",
				args: [vault, maxUint256],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId: selectedChainId, confirmations: 1 }), {
				pending: { render: <TxToast title="Approving ZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
				success: { render: <TxToast title="Successfully approved ZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
			});

			refetch();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleSubmit = async () => {
		if (!address) return;

		try {
			setSubmitting(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				chainId: selectedChainId,
				address: vault,
				abi: ERC4626ABI,
				functionName: isUnwrap ? "redeem" : "deposit",
				args: isUnwrap ? [amount, address, address] : [amount, address],
			});

			const toastContent = [
				{
					title: isUnwrap ? "Unwrapping:" : "Wrapping:",
					value: `${formatCurrency(formatUnits(amount, 18))} ${isUnwrap ? "svZCHF" : "ZCHF"}`,
				},
				{ title: "Transaction:", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId: selectedChainId, confirmations: 1 }), {
				pending: { render: <TxToast title={isUnwrap ? "Unwrapping svZCHF..." : "Wrapping ZCHF..."} rows={toastContent} /> },
				success: {
					render: (
						<TxToast title={isUnwrap ? "Successfully unwrapped svZCHF" : "Successfully wrapped ZCHF"} rows={toastContent} />
					),
				},
			});

			track(isUnwrap ? "vault_unwrapped" : "vault_wrapped", { amount: formatUnits(amount, 18), chain: chain.name });
			setAmount(0n);
			refetch();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
			<AppCard>
				<div className="text-lg font-bold text-center">{isUnwrap ? "Unwrap svZCHF" : "Wrap ZCHF"}</div>

				<div className="mt-8">
					<TokenInputChain
						label={isUnwrap ? "You unwrap" : "You wrap"}
						symbol={isUnwrap ? "svZCHF" : "ZCHF"}
						tokenLogo="ZCHF"
						chain={chain.name}
						chains={VAULT_CHAIN_NAMES}
						value={amount.toString()}
						onChange={onChangeAmount}
						max={balance}
						reset={0n}
						limit={balance}
						limitDigit={18}
						limitLabel="Balance"
						onChangeChain={onChangeChain}
						disabled={isViewingOtherAddress}
						error={errorAmount()}
					/>
				</div>

				<div className="mt-4 flex justify-center">
					<AppToggle label="Unwrap instead" enabled={isUnwrap} onChange={setUnwrap} disabled={isViewingOtherAddress} />
				</div>

				<div className="mx-auto my-4 w-full flex-col flex gap-4">
					<GuardSupportedChain chainId={selectedChainId as ChainId} disabled={isViewingOtherAddress}>
						{needsApproval ? (
							<AppButton className="h-10" disabled={isViewingOtherAddress} isLoading={isApproving} onClick={handleApprove}>
								Approve ZCHF
							</AppButton>
						) : (
							<AppButton className="h-10" disabled={disabled} isLoading={isSubmitting} onClick={handleSubmit}>
								{isUnwrap ? "Unwrap" : "Wrap"}
							</AppButton>
						)}
					</GuardSupportedChain>
				</div>
			</AppCard>

			<VaultDetailsCard
				chain={chain}
				vault={vault}
				isUnwrap={isUnwrap}
				amount={amount}
				preview={preview}
				svZchfBalance={svZchfBalance}
				svZchfValue={svZchfValue}
				exchangeRate={exchangeRate}
			/>
		</section>
	);
}
