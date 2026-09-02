import { useState } from "react";
import { Address, erc20Abi, formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { useConnection, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { ADDRESS, ChainId, ChainIdSide } from "@frankencoin/zchf";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import TokenLogo from "@components/TokenLogo";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import MigrationTokenSwapRow from "./MigrationTokenSwapRow";
import { useMigrationQuotes, useMigrationTokenBalances, useUserBalance } from "@hooks";
import { formatCurrency, normalizeAddress } from "@utils";
import { ERC4626ABI } from "../../abis/ERC4626";
import { WAGMI_CONFIG } from "../../app.config";

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
	const { data: svZchfBalance, refetch: refetchSvZchfBalance } = useReadContract({
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
	const [isUnwrapping, setUnwrapping] = useState(false);

	const heldTokens = balances.filter((token) => token.balance > 0n);
	const { quotes, isLoading: isLoadingQuotes } = useMigrationQuotes(viewAddress, heldTokens);

	const isOwnWallet = !!address && !!viewAddress && normalizeAddress(address) === normalizeAddress(viewAddress);
	const hasSvZchf = (svZchfBalance ?? 0n) > 0n;

	const onChangeSlippage = (tokenAddress: Address, value: string) => {
		const parsed = Number(value);
		setSlippage((prev) => ({ ...prev, [tokenAddress]: isNaN(parsed) ? 0 : parsed }));
	};

	const handleUnwrapSvZchf = async () => {
		if (!address || !isOwnWallet || !hasSvZchf) return;

		try {
			setUnwrapping(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				chainId: gnosis.id,
				address: svZchfToken,
				abi: ERC4626ABI,
				functionName: "redeem",
				args: [svZchfBalance ?? 0n, address, address],
			});

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, chainId: gnosis.id, confirmations: 1 }), {
				pending: { render: <TxToast title="Unwrapping svZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
				success: { render: <TxToast title="Successfully unwrapped svZCHF" rows={[{ title: "Transaction:", hash: writeHash }]} /> },
			});

			refetchSvZchfBalance();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setUnwrapping(false);
		}
	};

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">1. Assets on Gnosis Chain</div>
			<div className="mt-2 text-text-secondary text-center">Overview of the tokens held by your wallet on Gnosis Chain.</div>

			<div className="mt-6 overflow-x-auto">
				<div className="min-w-[680px] flex flex-col gap-2">
					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-3 text-xs font-semibold text-text-secondary">
						<span>Token</span>
						<span className="text-right">Balance</span>
						<span className="text-right">Slippage</span>
						<span className="text-right">Est. Output (ZCHF)</span>
						<span className="text-right">Action</span>
					</div>

					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary opacity-60">
						<div className="flex items-center gap-2">
							<TokenLogo currency="ZCHF" chain={gnosis.name} />
							<span className="font-medium">ZCHF</span>
						</div>
						<span className="text-right">{formatCurrency(formatUnits(zchfBalance, 18))}</span>
						<span className="text-right text-text-secondary">—</span>
						<span className="text-right text-text-secondary">already ZCHF</span>
						<span className="text-right text-text-secondary">—</span>
					</div>

					<div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary">
						<div className="flex items-center gap-2">
							<TokenLogo currency="ZCHF" chain={gnosis.name} />
							<span className="font-medium">svZCHF</span>
						</div>
						<span className="text-right">{formatCurrency(formatUnits(svZchfBalance ?? 0n, 18))}</span>
						<span className="text-right text-text-secondary">—</span>
						<span className="text-right text-text-secondary">{formatCurrency(formatUnits(svZchfRedeemPreview ?? 0n, 18))}</span>
						<div className="flex justify-end">
							{address ? (
								<GuardSupportedChain
									size="small"
									width="auto"
									chainId={gnosis.id as ChainId}
									disabled={!isOwnWallet || !hasSvZchf}
								>
									<AppButton
										size="small"
										width="auto"
										disabled={!isOwnWallet || !hasSvZchf}
										isLoading={isUnwrapping}
										onClick={handleUnwrapSvZchf}
									>
										Unwrap
									</AppButton>
								</GuardSupportedChain>
							) : (
								<span className="text-right text-text-secondary">—</span>
							)}
						</div>
					</div>

					{isLoading ? (
						<div className="text-text-secondary text-center py-4">Loading token balances...</div>
					) : heldTokens.length === 0 ? (
						<div className="text-text-secondary text-center py-4">No other tokens held on Gnosis Chain.</div>
					) : (
						heldTokens.map((token) => (
							<MigrationTokenSwapRow
								key={token.address}
								token={token}
								quote={quotes[token.address]}
								isLoadingQuote={isLoadingQuotes}
								slippage={slippage[token.address] ?? DEFAULT_SLIPPAGE_PCT}
								onChangeSlippage={(value) => onChangeSlippage(token.address, value)}
								ownerAddress={address}
								isOwnWallet={isOwnWallet}
							/>
						))
					)}
				</div>
			</div>

			<div className="mt-4 text-xs text-text-secondary text-center">
				Swaps are executed via CoW Protocol and settle asynchronously once a solver fills them. Tokens without enough allowance need
				to be approved first.
			</div>
		</AppCard>
	);
}
