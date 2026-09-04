import { useEffect, useRef, useState } from "react";
import { gnosis, optimism } from "viem/chains";
import { useConnection, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address, erc20Abi, formatUnits, Hash, maxUint256 } from "viem";
import { toast } from "react-toastify";
import { ADDRESS, ChainIdSide } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import TokenInput from "@components/Input/TokenInput";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { buildCCIPTokenAndDataMessage, CCIP_SEND_GAS_LIMIT, formatCurrency, FormatType, shortenAddress } from "@utils";
import { useUserBalance } from "@hooks";
import { CCIPRouterABI } from "../../abis/CCIPRouter";
import { ERC4626ABI } from "../../abis/ERC4626";
import { WAGMI_CONFIG } from "../../app.config";

interface Props {
	viewAddress?: Address;
	isViewingOtherAddress?: boolean;
}

export default function MigrationBridgeCard({ viewAddress, isViewingOtherAddress }: Props) {
	const [isApproving, setApproving] = useState(false);
	const [isBridging, setBridging] = useState(false);
	const [ccipFee, setCcipFee] = useState<bigint>(0n);
	const { address } = useConnection();

	const userBalance = useUserBalance(viewAddress);
	const zchfBalance = userBalance[gnosis.id as ChainIdSide]?.frankencoin ?? 0n;

	const [bridgeAmount, setBridgeAmount] = useState<bigint>(0n);
	const hasEditedAmount = useRef(false);

	useEffect(() => {
		hasEditedAmount.current = false;
	}, [viewAddress]);

	useEffect(() => {
		if (!hasEditedAmount.current) setBridgeAmount(zchfBalance);
	}, [zchfBalance]);

	const onChangeBridgeAmount = (value: string) => {
		hasEditedAmount.current = true;
		setBridgeAmount(value === "" ? 0n : BigInt(value));
	};

	const zchfToken = ADDRESS[gnosis.id as ChainIdSide].ccipBridgedFrankencoin;
	const router = ADDRESS[gnosis.id as ChainIdSide].ccipRouter;
	const ccipWrapperOptimism = ADDRESS[optimism.id].CCIPWrapper;

	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		chainId: gnosis.id,
		address: zchfToken,
		abi: erc20Abi,
		functionName: "allowance",
		args: [viewAddress ?? "0x0000000000000000000000000000000000000000", router],
	});

	const svZchfTokenOptimism = ADDRESS[optimism.id].svZCHF;
	const { data: svZchfPrice } = useReadContract({
		chainId: optimism.id,
		address: svZchfTokenOptimism,
		abi: ERC4626ABI,
		functionName: "convertToAssets",
		args: [10n ** 18n],
	});
	const { data: estimatedSvZchf } = useReadContract({
		chainId: optimism.id,
		address: svZchfTokenOptimism,
		abi: ERC4626ABI,
		functionName: "previewDeposit",
		args: [bridgeAmount],
	});

	useEffect(() => {
		const fetcher = async () => {
			if (!viewAddress || bridgeAmount === 0n) {
				setCcipFee(0n);
				return;
			}

			const message = buildCCIPTokenAndDataMessage({
				receiver: ccipWrapperOptimism,
				recipient: viewAddress,
				token: zchfToken,
				amount: bridgeAmount,
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
	}, [viewAddress, bridgeAmount]);

	const errorAmount = () => {
		if (bridgeAmount > zchfBalance) return "Not enough ZCHF in your wallet.";
		return "";
	};

	const needsApproval = bridgeAmount > 0n && (allowance ?? 0n) < bridgeAmount;
	const disabled = !address || isViewingOtherAddress || bridgeAmount === 0n || errorAmount() !== "";

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
				receiver: ccipWrapperOptimism,
				recipient: address,
				token: zchfToken,
				amount: bridgeAmount,
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
				{ title: "Bridge:", value: `${formatCurrency(formatUnits(bridgeAmount, 18))} ZCHF` },
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

			<div className="mt-6 grid md:grid-cols-2 gap-6">
				<div className="flex flex-col gap-2">
					<TokenInput
						symbol="ZCHF"
						label="ZCHF to bridge"
						chain={gnosis.name}
						value={bridgeAmount.toString()}
						digit={18}
						onChange={onChangeBridgeAmount}
						max={zchfBalance}
						reset={0n}
						limit={zchfBalance}
						limitDigit={18}
						limitLabel="Balance"
						disabled={isViewingOtherAddress}
						error={errorAmount()}
					/>

					{/* {bridgeAmount > 0n && (
						<div className="text-sm text-text-secondary text-center">
							Estimated CCIP fee: {Math.round(Number(formatUnits(ccipFee, 18)) * 100000000) / 100000000}{" "}
							{gnosis.nativeCurrency.symbol}
						</div>
					)} */}

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

				<div className="flex flex-col gap-2 pt-3">
					<div className="flex">
						<div className="flex-1 text-text-secondary">Exchange rate</div>
						<div className="">
							1 svZCHF = {formatCurrency(formatUnits(svZchfPrice ?? 10n ** 18n, 18), 4, 4, FormatType.us)} ZCHF
						</div>
					</div>

					<hr className="border-slate-700 border-dashed" />

					<div className="flex">
						<div className="flex-1 text-text-secondary">You send</div>
						<div className="">{formatCurrency(formatUnits(bridgeAmount, 18))} ZCHF</div>
					</div>

					<div className="flex font-bold">
						<div className="flex-1 text-text-secondary">You receive</div>
						<div className="">{formatCurrency(formatUnits(estimatedSvZchf ?? 0n, 18))} svZCHF</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
