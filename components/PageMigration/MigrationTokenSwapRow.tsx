import { useState } from "react";
import { Address, erc20Abi, formatUnits, maxUint256, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { ADDRESS, ChainId, ChainIdSide } from "@frankencoin/zchf";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import MigrationTokenLogo from "./MigrationTokenLogo";
import { MigrationQuote, MigrationTokenBalance } from "@hooks";
import { buildPresignBatchCall, COW_VAULT_RELAYER_GNOSIS, formatCurrency, getMigrationQuote, sendPresignBatch } from "@utils";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	token: MigrationTokenBalance;
	quote?: MigrationQuote;
	isLoadingQuote: boolean;
	slippage: number;
	onChangeSlippage: (value: string) => void;
	ownerAddress?: Address;
	isOwnWallet: boolean;
}

export default function MigrationTokenSwapRow({
	token,
	quote,
	isLoadingQuote,
	slippage,
	onChangeSlippage,
	ownerAddress,
	isOwnWallet,
}: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isSwapping, setSwapping] = useState(false);

	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		chainId: gnosis.id,
		address: token.address,
		abi: erc20Abi,
		functionName: "allowance",
		args: [ownerAddress ?? zeroAddress, COW_VAULT_RELAYER_GNOSIS],
	});

	const needsApproval = (allowance ?? 0n) < token.balance;
	const disabled = !ownerAddress || !isOwnWallet;

	const handleApprove = async () => {
		if (!ownerAddress) return;

		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				chainId: gnosis.id,
				address: token.address,
				abi: erc20Abi,
				functionName: "approve",
				args: [COW_VAULT_RELAYER_GNOSIS, maxUint256],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId: gnosis.id, confirmations: 1 }), {
				pending: { render: <TxToast title={`Approving ${token.symbol}`} rows={[{ title: "Transaction:", hash: writeHash }]} /> },
				success: {
					render: <TxToast title={`Successfully approved ${token.symbol}`} rows={[{ title: "Transaction:", hash: writeHash }]} />,
				},
			});

			refetchAllowance();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleSwap = async () => {
		if (!ownerAddress) return;

		try {
			setSwapping(true);

			const zchf = ADDRESS[gnosis.id as ChainIdSide].ccipBridgedFrankencoin;
			const slippageBps = Math.round(slippage * 100);

			const orderQuote = await getMigrationQuote({
				owner: ownerAddress,
				sellToken: token.address,
				sellTokenDecimals: token.decimals,
				buyToken: zchf,
				buyTokenDecimals: 18,
				sellAmount: token.balance,
				slippageBps,
			});

			// approval already covers this swap — only the presign call needs sending
			const { calls } = await buildPresignBatchCall(orderQuote, ownerAddress, token.address, token.balance);
			const [, presignCall] = calls;

			await toast.promise(sendPresignBatch([presignCall]), {
				pending: `Submitting ${token.symbol} swap to CoW Protocol...`,
				success: "Swap order submitted — it will settle once a CoW solver fills it.",
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSwapping(false);
		}
	};

	return (
		<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary">
			<div className="flex items-center gap-2">
				<MigrationTokenLogo logoURI={token.logoURI} symbol={token.symbol} />
				<span className="font-medium">{token.symbol}</span>
			</div>
			<span className="text-right">{formatCurrency(formatUnits(token.balance, token.decimals))}</span>
			<div className="flex items-center justify-end gap-1">
				<input
					type="number"
					min={0}
					max={100}
					step={0.1}
					value={slippage}
					onChange={(e) => onChangeSlippage(e.target.value)}
					className="w-16 text-right bg-transparent border border-card-input-border rounded px-1 py-0.5 text-sm focus:outline-none focus:border-card-input-focus"
				/>
				<span className="text-text-secondary text-sm">%</span>
			</div>
			<span className="text-right text-text-secondary">
				{quote ? formatCurrency(formatUnits(quote.buyAmount, 18)) : isLoadingQuote ? "..." : "—"}
			</span>
			<div className="flex justify-end">
				{ownerAddress ? (
					<GuardSupportedChain size="small" width="auto" chainId={gnosis.id as ChainId} disabled={disabled}>
						{needsApproval ? (
							<AppButton size="small" width="auto" disabled={disabled} isLoading={isApproving} onClick={handleApprove}>
								Approve
							</AppButton>
						) : (
							<AppButton size="small" width="auto" disabled={disabled} isLoading={isSwapping} onClick={handleSwap}>
								Swap
							</AppButton>
						)}
					</GuardSupportedChain>
				) : (
					<span className="text-right text-text-secondary">—</span>
				)}
			</div>
		</div>
	);
}
