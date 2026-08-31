import { useEffect, useState } from "react";
import { gnosis, optimism } from "viem/chains";
import { useConnection, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address, erc20Abi, formatUnits, Hash, maxUint256 } from "viem";
import { toast } from "react-toastify";
import { ADDRESS, ChainIdSide, SavingsABI } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { buildCCIPTokenAndDataMessage, CCIP_SEND_GAS_LIMIT, CCIP_WRAPPER_OPTIMISM, formatCurrency, shortenAddress } from "@utils";
import { useUserBalance } from "@hooks";
import { CCIPRouterABI } from "../../abis/CCIPRouter";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	viewAddress?: Address;
	isViewingOtherAddress?: boolean;
}

export default function MigrationBridgeCard({ viewAddress, isViewingOtherAddress }: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isBridging, setBridging] = useState(false);
	const [ccipFee, setCcipFee] = useState<bigint>(0n);
	const [optimismSavings, setOptimismSavings] = useState<bigint>(0n);
	const { address } = useConnection();

	const userBalance = useUserBalance(viewAddress);
	const amount = userBalance[gnosis.id as ChainIdSide]?.frankencoin ?? 0n;

	const zchfToken = ADDRESS[gnosis.id as ChainIdSide].ccipBridgedFrankencoin;
	const router = ADDRESS[gnosis.id as ChainIdSide].ccipRouter;

	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		chainId: gnosis.id,
		address: zchfToken,
		abi: erc20Abi,
		functionName: "allowance",
		args: [viewAddress ?? "0x0000000000000000000000000000000000000000", router],
	});

	useEffect(() => {
		const fetcher = async () => {
			if (!viewAddress || amount === 0n) {
				setCcipFee(0n);
				return;
			}

			const message = buildCCIPTokenAndDataMessage({
				receiver: CCIP_WRAPPER_OPTIMISM,
				recipient: viewAddress,
				token: zchfToken,
				amount,
				gasLimit: CCIP_SEND_GAS_LIMIT,
			});

			const fee = await readContract(WAGMI_CONFIG, {
				address: router,
				chainId: gnosis.id,
				abi: CCIPRouterABI,
				functionName: "getFee",
				args: [BigInt(ADDRESS[optimism.id as ChainIdSide].chainSelector), message],
			});

			setCcipFee(fee);
		};

		fetcher();
	}, [viewAddress, amount]);

	useEffect(() => {
		const fetcher = async () => {
			if (!viewAddress) {
				setOptimismSavings(0n);
				return;
			}

			const [saved] = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[optimism.id as ChainIdSide].ccipBridgedSavings,
				chainId: optimism.id,
				abi: SavingsABI,
				functionName: "savings",
				args: [viewAddress],
			});

			setOptimismSavings(saved);
		};

		fetcher();
	}, [viewAddress]);

	const needsApproval = amount > 0n && (allowance ?? 0n) < amount;
	const disabled =
		!address || isViewingOtherAddress || amount === 0n || CCIP_WRAPPER_OPTIMISM === "0x0000000000000000000000000000000000000000";

	const handleApprove = async () => {
		try {
			setApproving(true);
			const writeHash = await writeContract(WAGMI_CONFIG, {
				chainId: gnosis.id,
				address: zchfToken,
				abi: erc20Abi,
				functionName: "approve",
				args: [router, maxUint256],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Approving ZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
				success: { render: <TxToast title="Successfully approved ZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
			});

			refetchAllowance();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleBridge = async () => {
		if (!address) return;

		try {
			setBridging(true);

			const message = buildCCIPTokenAndDataMessage({
				receiver: CCIP_WRAPPER_OPTIMISM,
				recipient: address,
				token: zchfToken,
				amount,
				gasLimit: CCIP_SEND_GAS_LIMIT,
			});

			const writeHash: Hash = await writeContract(WAGMI_CONFIG, {
				chainId: gnosis.id,
				address: router,
				abi: CCIPRouterABI,
				functionName: "ccipSend",
				args: [BigInt(ADDRESS[optimism.id as ChainIdSide].chainSelector), message],
				value: (ccipFee * 12n) / 10n, // @dev add 20% buffer; router refunds unused amount
			});

			const toastContent = [
				{ title: "Recipient:", value: shortenAddress(address) },
				{ title: "Bridge:", value: `${formatCurrency(formatUnits(amount, 18))} ZCHF` },
				{ title: "Transaction:", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Bridging to Optimism..." rows={toastContent} /> },
				success: { render: <TxToast title="Bridge to Optimism submitted" rows={toastContent} /> },
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setBridging(false);
		}
	};

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">2. Bridge to Optimism</div>
			<div className="mt-2 text-text-secondary text-center">
				Send your ZCHF from Gnosis Chain to Optimism, where it is automatically wrapped into savings for your wallet.
			</div>

			<div className="mt-6 flex flex-col gap-2">
				<div className="flex items-center justify-between p-3 rounded-lg bg-card-body-primary">
					<span className="text-text-secondary">ZCHF to bridge</span>
					<span className="font-medium">{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
				</div>
				<div className="flex items-center justify-between p-3 rounded-lg bg-card-body-primary">
					<span className="text-text-secondary">Current savings balance on Optimism</span>
					<span className="font-medium">{formatCurrency(formatUnits(optimismSavings, 18))} ZCHF</span>
				</div>
			</div>

			{amount > 0n && (
				<div className="mt-2 text-sm text-text-secondary text-center">
					Estimated CCIP fee: {Math.round(Number(formatUnits(ccipFee, 18)) * 100000000) / 100000000}{" "}
					{gnosis.nativeCurrency.symbol}
				</div>
			)}

			<div className="mt-6">
				<GuardSupportedChain chainId={gnosis.id as ChainIdSide}>
					{needsApproval ? (
						<AppButton className="h-10" disabled={isViewingOtherAddress} isLoading={isApproving} onClick={handleApprove}>
							Approve
						</AppButton>
					) : (
						<AppButton className="h-10" disabled={disabled} isLoading={isBridging} onClick={handleBridge}>
							Bridge to Optimism
						</AppButton>
					)}
				</GuardSupportedChain>
			</div>

			{CCIP_WRAPPER_OPTIMISM === "0x0000000000000000000000000000000000000000" && (
				<div className="mt-2 text-xs text-text-secondary text-center">
					Waiting on the CCIPWrapper contract to be deployed on Optimism.
				</div>
			)}
		</AppCard>
	);
}
