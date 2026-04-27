import ChainBySelect from "./ChainBySelect";

interface Props {
	label?: string;
	chains: string[];
	chain: string;
	onChangeChain: (name: string) => void;
	pct: string; // formatted percentage string, e.g. "12.34%"
}

export default function ChainSyncedVotes({ label, chains, chain, onChangeChain, pct }: Props) {
	return (
		<div className="border-card-input-border border-2 rounded-lg px-3 py-1 bg-card-input-disabled">
			{label && <div className="flex my-1 text-sm text-text-secondary">{label}</div>}
			<div className="grid md:grid-cols-6">
				<div className="md:col-span-4 flex items-center py-2 text-lg text-text-primary font-semibold">{pct}</div>
				<div className="md:col-span-2" onClick={(e) => e.stopPropagation()}>
					<ChainBySelect chains={chains} chain={chain} chainOnChange={onChangeChain} invertColors={true} />
				</div>
			</div>
		</div>
	);
}
