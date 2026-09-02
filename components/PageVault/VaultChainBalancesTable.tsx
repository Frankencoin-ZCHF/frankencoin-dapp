import AppCard from "@components/AppCard";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency } from "@utils";
import { formatUnits, Address } from "viem";
import { gnosis, mainnet, optimism } from "viem/chains";
import { useVaultBalances } from "@hooks";

interface Props {
	viewAddress?: Address;
}

const ROWS = [mainnet, optimism, gnosis];

export default function VaultChainBalancesTable({ viewAddress }: Props) {
	const { data, isLoading } = useVaultBalances(viewAddress);

	const totalBalanceValue = ROWS.reduce((sum, chain) => sum + data[chain.id as keyof typeof data].balanceValue, 0n);

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">Vault Insights</div>
			<div className="mt-2 text-text-secondary text-center">Your svZCHF position and the vault size on each supported chain.</div>

			<div className="mt-6 overflow-x-auto">
				<div className="min-w-[600px] flex flex-col gap-2">
					<div className="grid grid-cols-[1fr_1fr_1fr_1fr] px-3 text-xs font-semibold text-text-secondary">
						<span>Chain</span>
						<span className="text-right">Your svZCHF</span>
						<span className="text-right">Value (ZCHF)</span>
						<span className="text-right">Vault TVL (ZCHF)</span>
					</div>

					{ROWS.map((chain) => {
						const stats = data[chain.id as keyof typeof data];
						return (
							<div
								key={chain.id}
								className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center p-3 rounded-lg bg-card-body-primary"
							>
								<div className="flex items-center gap-2">
									<TokenLogo currency="ZCHF" chain={chain.name} />
									<span className="font-medium">{chain.name}</span>
								</div>
								<span className="text-right">{formatCurrency(formatUnits(stats.balance, 18))}</span>
								<span className="text-right">{formatCurrency(formatUnits(stats.balanceValue, 18))}</span>
								<span className="text-right text-text-secondary">{formatCurrency(formatUnits(stats.totalAssets, 18))}</span>
							</div>
						);
					})}

					<div className="grid grid-cols-[1fr_1fr_1fr_1fr] px-3 pt-2 font-bold">
						<span>Total</span>
						<span className="text-right">—</span>
						<span className="text-right">{formatCurrency(formatUnits(totalBalanceValue, 18))} ZCHF</span>
						<span className="text-right">—</span>
					</div>
				</div>
			</div>

			{isLoading ? <div className="text-text-secondary text-center py-2 text-sm">Loading vault balances...</div> : null}
		</AppCard>
	);
}
