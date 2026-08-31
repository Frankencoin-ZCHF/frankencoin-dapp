import { Address } from "viem";
import { gnosis } from "viem/chains";
import AppCard from "@components/AppCard";
import AppButton from "@components/AppButton";
import DisplayAmount from "@components/DisplayAmount";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import MigrationTokenLogo from "./MigrationTokenLogo";
import { useMigrationTokenBalances } from "@hooks";
import { MIGRATION_TOKENS } from "@utils";
import { ChainId } from "@frankencoin/zchf";

interface Props {
	viewAddress?: Address;
}

export default function MigrationTokenSwapCard({ viewAddress }: Props) {
	const { balances, isLoading } = useMigrationTokenBalances(viewAddress);

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">1. Assets on Gnosis Chain</div>
			<div className="mt-2 text-text-secondary text-center">Overview of the tokens held by your wallet on Gnosis Chain.</div>

			<div className="mt-6 flex flex-col gap-2">
				{MIGRATION_TOKENS.length === 0 ? (
					<div className="text-text-secondary text-center py-4">
						{isLoading ? "Loading token balances..." : "No tokens configured for migration yet."}
					</div>
				) : (
					balances.map((token) => (
						<div key={token.address} className="flex items-center justify-between p-3 rounded-lg bg-card-body-primary">
							<div className="flex items-center gap-2">
								<MigrationTokenLogo logoURI={token.logoURI} symbol={token.symbol} />
								<span className="font-medium">{token.symbol}</span>
							</div>
							<DisplayAmount amount={token.balance} digits={token.decimals} currency={token.symbol} hideLogo />
						</div>
					))
				)}
			</div>

			<div className="mt-6">
				<GuardSupportedChain chainId={gnosis.id as ChainId}>
					<AppButton className="h-10" disabled={true}>
						Swap All to ZCHF
					</AppButton>
				</GuardSupportedChain>
			</div>
			<div className="mt-2 text-xs text-text-secondary text-center">Swap execution is not wired up yet.</div>
		</AppCard>
	);
}
