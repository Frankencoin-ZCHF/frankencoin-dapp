export default function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex justify-between items-center py-0.5">
			<span className="text-text-secondary text-sm">{label}</span>
			<div className="text-text-primary text-sm font-medium text-right">{children}</div>
		</div>
	);
}
