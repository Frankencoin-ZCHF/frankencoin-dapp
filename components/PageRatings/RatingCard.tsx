import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import LoadingSpin from "@components/LoadingSpin";
import type { XerberusEntityType, XerberusRating } from "@utils";

interface Props {
	name: string;
	subtitle: string;
	type: XerberusEntityType;
	id: string;
	rating: XerberusRating | undefined;
	loading: boolean;
	error: string | null;
}

function scoreColor(score: number): string {
	if (score >= 70) return "text-green-500";
	if (score >= 40) return "text-yellow-500";
	return "text-red-500";
}

function xerberusReportUrl(type: XerberusEntityType, id: string): string {
	if (type === "pool") return `https://app.xerberus.io/pool/dendrogram/${id}`;
	if (type === "protocol") return `https://app.xerberus.io/protocol/${id}`;
	if (type === "organisation") return `https://app.xerberus.io/organisation/${id}`;
	return "https://app.xerberus.io";
}

function ScoreDisplay({ score, loading, error }: { score: number | null; loading: boolean; error: string | null }) {
	if (loading) {
		return <LoadingSpin classes="text-text-secondary w-10 h-10" />;
	}
	if (score == null) {
		return (
			<span className="text-text-secondary font-bold text-5xl leading-none" title={error ?? "Score unavailable"}>
				{error ? "n/a" : "—"}
			</span>
		);
	}
	return <span className={`${scoreColor(score)} font-bold text-5xl leading-none`}>{score}%</span>;
}

export default function RatingCard({ name, subtitle, type, id, rating, loading, error }: Props) {
	return (
		<AppCard className="p-5 flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<img src="/coin/zchf.png" alt="" className="h-10 w-10 rounded-full" />
				<div>
					<div className="font-bold text-text-primary text-lg leading-tight">{name}</div>
					<div className="text-text-secondary text-sm">{subtitle}</div>
				</div>
			</div>

			<div className="flex items-baseline gap-3">
				<ScoreDisplay score={rating?.score ?? null} loading={loading} error={error} />
				<span className="text-text-secondary text-sm">Xerberus rating</span>
			</div>

			<AppLink label="View full report on Xerberus" href={xerberusReportUrl(type, id)} external={true} className="" />
		</AppCard>
	);
}
