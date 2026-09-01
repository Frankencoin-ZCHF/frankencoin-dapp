import { useState } from "react";
import { Address, encodeFunctionData, erc20Abi, formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { useConnection, useReadContract } from "wagmi";
import { toast } from "react-toastify";
import { ADDRESS, ChainId, ChainIdSide } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import TokenLogo from "@components/TokenLogo";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToast } from "@components/TxToast";
import MigrationTokenLogo from "./MigrationTokenLogo";
import { useMigrationQuotes, useMigrationTokenBalances, useUserBalance } from "@hooks";
import { buildPresignBatchCall, formatCurrency, getMigrationQuote, normalizeAddress, PresignBatchCall, sendPresignBatch } from "@utils";
import { ERC4626ABI } from "../../abis/ERC4626";

interface Props {
	viewAddress?: Address;
}

const DEFAULT_SLIPPAGE_PCT = 0.5;

export default function MigrationTokenSwapCard({ viewAddress }: Props) {
	const { address } = useConnection();
	const { balances, isLoading } = useMigrationTokenBalances(viewAddress);
	const userBalance = useUserBalance(viewAddress);
	const zchfBalance = userBalance[gnosis.id as ChainIdSide]?.frankencoin ?? 0n;

	const svZchfToken = ADDRESS[gnosis.id].svZCHF;
	const { data: svZchfBalance } = useReadContract({
		chainId: gnosis.id,
		address: svZchfToken,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [viewAddress ?? "0x0000000000000000000000000000000000000000"],
	});
	const { data: svZchfRedeemPreview } = useReadContract({
		chainId: gnosis.id,
		address: svZchfToken,
		abi: ERC4626ABI,
		functionName: "previewRedeem",
		args: [svZchfBalance ?? 0n],
	});

	const [slippage, setSlippage] = useState<Record<Address, number>>({});
	const [isSwapping, setSwapping] = useState(false);

	const heldTokens = balances.filter((token) => token.balance > 0n);
	const { quotes, isLoading: isLoadingQuotes } = useMigrationQuotes(viewAddress, heldTokens);

	const isOwnWallet = !!address && !!viewAddress && normalizeAddress(address) === normalizeAddress(viewAddress);
	const hasSvZchf = (svZchfBalance ?? 0n) > 0n;
	const canSwap = heldTokens.length > 0 || hasSvZchf;

	const onChangeSlippage = (address: Address, value: string) => {
		const parsed = Number(value);
		setSlippage((prev) => ({ ...prev, [address]: isNaN(parsed) ? 0 : parsed }));
	};

	const handleSwapAll = async () => {
		if (!address || !isOwnWallet || !canSwap) return;

		try {
			setSwapping(true);

			const zchf = ADDRESS[gnosis.id as ChainIdSide].ccipBridgedFrankencoin;
			const allCalls: PresignBatchCall[] = [];

			for (const token of heldTokens) {
				const slippageBps = Math.round((slippage[token.address] ?? DEFAULT_SLIPPAGE_PCT) * 100);

				const quote = await getMigrationQuote({
					owner: address,
					sellToken: token.address,
					sellTokenDecimals: token.decimals,
					buyToken: zchf,
					buyTokenDecimals: 18,
					sellAmount: token.balance,
					slippageBps,
				});

				const { calls } = await buildPresignBatchCall(quote, address, token.address, token.balance);
				allCalls.push(...calls);
			}

			if (hasSvZchf) {
				allCalls.push({
					to: svZchfToken,
					data: encodeFunctionData({
						abi: ERC4626ABI,
						functionName: "redeem",
						args: [svZchfBalance ?? 0n, address, address],
					}),
				});
			}

			console.log(
				`[migration] bundling ${allCalls.length} calls for ${heldTokens.length} swap(s)${hasSvZchf ? " + 1 svZCHF unwrap" : ""}:`,
				allCalls
			);

			await toast.promise(sendPresignBatch(allCalls), {
				pending: `Submitting ${heldTokens.length} swap${heldTokens.length > 1 ? "s" : ""}${
					hasSvZchf ? " and unwrapping svZCHF" : ""
				} to CoW Protocol...`,
				success: "Swap orders submitted — they will settle once CoW's solvers fill them.",
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setSwapping(false);
		}
	};

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">1. Assets on Gnosis Chain</div>
			<div className="mt-2 text-text-secondary text-center">Overview of the tokens held by your wallet on Gnosis Chain.</div>

			<div className="mt-6 overflow-x-auto">
				<div className="min-w-[560px] flex flex-col gap-2">
					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-3 text-xs font-semibold text-text-secondary">
						<span>Token</span>
						<span className="text-right">Balance</span>
						<span className="text-right">Slippage</span>
						<span className="text-right">Est. Output (ZCHF)</span>
					</div>

					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary opacity-60">
						<div className="flex items-center gap-2">
							<TokenLogo currency="ZCHF" chain={gnosis.name} />
							<span className="font-medium">ZCHF</span>
						</div>
						<span className="text-right">{formatCurrency(formatUnits(zchfBalance, 18))}</span>
						<span className="text-right text-text-secondary">—</span>
						<span className="text-right text-text-secondary">already ZCHF</span>
					</div>

					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary">
						<div className="flex items-center gap-2">
							<TokenLogo currency="ZCHF" chain={gnosis.name} />
							<span className="font-medium">svZCHF</span>
						</div>
						<span className="text-right">{formatCurrency(formatUnits(svZchfBalance ?? 0n, 18))}</span>
						<span className="text-right text-text-secondary">—</span>
						<span className="text-right text-text-secondary">
							{formatCurrency(formatUnits(svZchfRedeemPreview ?? 0n, 18))}
						</span>
					</div>

					{isLoading ? (
						<div className="text-text-secondary text-center py-4">Loading token balances...</div>
					) : heldTokens.length === 0 ? (
						<div className="text-text-secondary text-center py-4">No other tokens held on Gnosis Chain.</div>
					) : (
						heldTokens.map((token) => {
							const quote = quotes[token.address];
							return (
								<div
									key={token.address}
									className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary"
								>
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
											value={slippage[token.address] ?? DEFAULT_SLIPPAGE_PCT}
											onChange={(e) => onChangeSlippage(token.address, e.target.value)}
											className="w-16 text-right bg-transparent border border-card-input-border rounded px-1 py-0.5 text-sm focus:outline-none focus:border-card-input-focus"
										/>
										<span className="text-text-secondary text-sm">%</span>
									</div>
									<span className="text-right text-text-secondary">
										{quote ? formatCurrency(formatUnits(quote.buyAmount, 18)) : isLoadingQuotes ? "..." : "—"}
									</span>
								</div>
							);
						})
					)}
				</div>
			</div>

			<div className="mt-6">
				<GuardSupportedChain chainId={gnosis.id as ChainId}>
					<AppButton className="h-10" disabled={!isOwnWallet || !canSwap} isLoading={isSwapping} onClick={handleSwapAll}>
						Swap All to ZCHF
					</AppButton>
				</GuardSupportedChain>
			</div>
			<div className="mt-2 text-xs text-text-secondary text-center">
				Swaps are executed via CoW Protocol and settle asynchronously once a solver fills them; svZCHF is unwrapped directly — all
				of it batches into a single wallet transaction.
			</div>
		</AppCard>
	);
}
