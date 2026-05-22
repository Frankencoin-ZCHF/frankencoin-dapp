import Head from "next/head";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AppCard from "@components/AppCard";
import { useRatings } from "../hooks/useRatings";
import { usePharosRating } from "../hooks/usePharosRating";
import type { PharosDimensionKey, PharosRating } from "./api/ratings/pharos";
import type { XerberusEntityType } from "./api/ratings/list";

const HOW_IT_WORKS = [
	{
		n: 1,
		title: "Independent",
		body: "Ratings are produced by external analytics providers, not by the Frankencoin DAO.",
	},
	{
		n: 2,
		title: "Public Methodology",
		body: "Provider methodologies are documented so readers can check what each score measures.",
	},
	{
		n: 3,
		title: "Verifiable Sources",
		body: "Scores are backed by public on-chain, liquidity, and market data where possible.",
	},
];

type RatingCard = {
	type: XerberusEntityType;
	id: string;
	name: string;
	subtitle: string;
};

const RATING_CARDS: RatingCard[] = [
	{ type: "protocol", id: "frankencoin", name: "Frankencoin", subtitle: "Protocol" },
	{ type: "organisation", id: "frankencoin-dao", name: "Frankencoin", subtitle: "DAO" },
	{ type: "pool", id: "frankencoin-savings-eth", name: "Frankencoin Savings", subtitle: "Ethereum Vault" },
];

const PHAROS_DIMENSIONS: { key: PharosDimensionKey; label: string; shortLabel: string }[] = [
	{ key: "pegStability", label: "Peg stability", shortLabel: "Peg" },
	{ key: "liquidity", label: "Exit liquidity", shortLabel: "Exit" },
	{ key: "resilience", label: "Resilience", shortLabel: "Resil." },
	{ key: "decentralization", label: "Decentralization", shortLabel: "Decent." },
	{ key: "dependencyRisk", label: "Dependency risk", shortLabel: "Dep." },
];

const RADAR_CENTER = 95;
const RADAR_RADIUS = 58;
const RADAR_LABEL_RADIUS = 77;
const RADAR_VIEWBOX = "0 0 190 190";

const xerberusReportUrl = (type: XerberusEntityType, id: string) => {
	if (type === "pool") return `https://app.xerberus.io/pool/dendrogram/${id}`;
	return "https://app.xerberus.io";
};

const formatUpdatedAt = (updatedAt: number | null) => {
	if (!updatedAt) return null;
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(new Date(updatedAt * 1000));
};

export default function RatingsPage() {
	const { data, loading, error } = useRatings({
		types: Array.from(new Set(RATING_CARDS.map((c) => c.type))),
	});
	const pharos = usePharosRating();
	const pharosUpdatedAt = formatUpdatedAt(pharos.data?.updatedAt ?? null);

	const byKey = new Map(data.map((r) => [`${r.type}:${r.id}`, r]));

	return (
		<>
			<Head>
				<title>Frankencoin - Ratings</title>
			</Head>

			<div className="pt-6">
				<h1 className="font-bold text-2xl text-text-primary">Ratings</h1>
				<p className="mt-2 text-text-secondary max-w-4xl">
					The Frankencoin ecosystem is independently rated by{" "}
					<a
						href="https://xerberus.io/"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-card-input-max hover:text-card-input-hover font-medium"
					>
						<picture>
							<img src="/partner/xerberus.svg" alt="" className="h-4 w-4 inline-block align-text-bottom" />
						</picture>
						Xerberus
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-0.5" />
					</a>
					, an open-source on-chain risk-rating protocol with no affiliation to Frankencoin. The ZCHF stablecoin also has an
					independent Safety Score from{" "}
					<a
						href="https://pharos.watch/stablecoin/zchf-frankencoin/#report-card"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-card-input-max hover:text-card-input-hover font-medium"
					>
						<PharosLogo className="h-4 w-4 rounded-full bg-text-primary p-0.5 align-text-bottom" />
						Pharos
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-0.5" />
					</a>
					.
				</p>
			</div>

			<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
				{HOW_IT_WORKS.map((it) => (
					<AppCard key={it.n} className="p-5 flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<span className="flex-none w-7 h-7 rounded-full bg-text-primary text-white inline-flex items-center justify-center text-sm font-bold">
								{it.n}
							</span>
							<div className="font-bold text-text-primary">{it.title}</div>
						</div>
						<div className="text-text-secondary text-sm leading-relaxed">{it.body}</div>
					</AppCard>
				))}
			</div>

			<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
				{RATING_CARDS.map((c) => {
					const rating = byKey.get(`${c.type}:${c.id}`);
					return (
						<AppCard key={`${c.type}:${c.id}`} className="p-5 flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<picture>
									<img src="/coin/zchf.png" alt="" className="h-10 w-10 rounded-full" />
								</picture>
								<div>
									<div className="font-bold text-text-primary text-lg leading-tight">{c.name}</div>
									<div className="text-text-secondary text-sm">{c.subtitle}</div>
								</div>
							</div>
							<div className="flex items-baseline gap-2">
								<ScoreDisplay score={rating?.score ?? null} loading={loading} error={error} />
								<span className="text-text-secondary text-sm">Xerberus rating</span>
							</div>
							<a
								href={xerberusReportUrl(c.type, c.id)}
								target="_blank"
								rel="noreferrer"
								className="text-card-input-max hover:text-card-input-hover text-sm font-medium"
							>
								View full report on Xerberus
								<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-1" />
							</a>
						</AppCard>
					);
				})}
			</div>

			<div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4">
				<AppCard className="p-5 flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<picture>
							<img src="/coin/zchf.png" alt="" className="h-10 w-10 rounded-full" />
						</picture>
						<div>
							<div className="font-bold text-text-primary text-lg leading-tight">Frankencoin</div>
							<div className="inline-flex items-center gap-1 text-text-secondary text-sm">
								ZCHF Safety Score by <PharosLogo className="h-4 w-4 rounded-full bg-text-primary p-0.5" /> Pharos
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<PharosScoreDisplay rating={pharos.data} loading={pharos.loading} error={pharos.error} />
						<span className="text-text-secondary text-sm">Pharos rating</span>
					</div>
					<div className="text-text-secondary text-sm leading-relaxed">
						{pharos.data ? (
							<>
								Methodology {pharos.data.methodologyVersion ? `v${pharos.data.methodologyVersion}` : "version unavailable"}
								{pharosUpdatedAt ? ` - Updated ${pharosUpdatedAt} UTC` : ""}
							</>
						) : (
							"Peg, liquidity, resilience, decentralization, and dependency-risk analysis for ZCHF."
						)}
					</div>
					<a
						href="https://pharos.watch/stablecoin/zchf-frankencoin/#report-card"
						target="_blank"
						rel="noreferrer"
						className="text-card-input-max hover:text-card-input-hover text-sm font-medium"
					>
						View full report on Pharos
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-1" />
					</a>
				</AppCard>

				<AppCard className="p-5 flex flex-col gap-4">
					<div>
						<div className="font-bold text-text-primary text-lg leading-tight">Pharos dimensions</div>
						<div className="text-text-secondary text-sm">The Safety Score components published for ZCHF.</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-8 lg:gap-12 items-center">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-3">
							{PHAROS_DIMENSIONS.map(({ key, label }) => {
								const dimension = pharos.data?.dimensions[key];
								return (
									<div
										key={key}
										className="flex min-h-[42px] items-center justify-between gap-4 border-b border-card-input-border pb-2"
									>
										<div className="min-w-0">
											<div className="text-text-primary text-sm font-medium">{label}</div>
											<div className="text-text-secondary text-xs truncate" title={dimension?.detail ?? undefined}>
												{dimension?.detail ??
													(pharos.loading ? "Loading" : pharos.error ? "Unavailable" : "No data")}
											</div>
										</div>
										<div className="flex-none text-right">
											<div className="text-card-input-max font-bold leading-tight">{dimension?.grade ?? "—"}</div>
											<div className="text-text-secondary text-xs">
												{dimension?.score == null ? "—" : `${dimension.score}/100`}
											</div>
										</div>
									</div>
								);
							})}
						</div>
						<PharosRadarChart rating={pharos.data} loading={pharos.loading} />
					</div>
				</AppCard>
			</div>
		</>
	);
}

function ScoreDisplay({ score, loading, error }: { score: number | null; loading: boolean; error: string | null }) {
	if (loading) {
		return <span className="text-text-secondary font-bold text-5xl leading-none">—</span>;
	}
	if (score == null) {
		const label = error ? "n/a" : "—";
		return (
			<span className="text-text-secondary font-bold text-5xl leading-none" title={error ?? "Score unavailable"}>
				{label}
			</span>
		);
	}
	return <span className="text-green-500 font-bold text-5xl leading-none">{score}%</span>;
}

function PharosLogo({ className }: { className: string }) {
	return <img src="/partner/pharos.svg" alt="" className={className} />;
}

function PharosScoreDisplay({ rating, loading, error }: { rating: PharosRating | null; loading: boolean; error: string | null }) {
	if (loading) {
		return <span className="text-text-secondary font-bold text-5xl leading-none">—</span>;
	}
	if (!rating || rating.overallScore == null) {
		return (
			<span className="text-text-secondary font-bold text-5xl leading-none" title={error ?? "Score unavailable"}>
				n/a
			</span>
		);
	}
	return (
		<>
			<span className="text-card-input-max font-bold text-5xl leading-none">{rating.overallGrade}</span>
			<span className="text-text-primary font-bold text-2xl leading-none">{rating.overallScore}/100</span>
		</>
	);
}

function scoreToRadarPoint(index: number, score: number) {
	const angle = -Math.PI / 2 + (index * 2 * Math.PI) / PHAROS_DIMENSIONS.length;
	const radius = RADAR_RADIUS * (Math.max(0, Math.min(score, 100)) / 100);
	return {
		x: RADAR_CENTER + Math.cos(angle) * radius,
		y: RADAR_CENTER + Math.sin(angle) * radius,
	};
}

function radarPointsFor(scores: number[]) {
	return scores
		.map((score, index) => {
			const point = scoreToRadarPoint(index, score);
			return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
		})
		.join(" ");
}

function PharosRadarChart({ rating, loading }: { rating: PharosRating | null; loading: boolean }) {
	const scores = PHAROS_DIMENSIONS.map(({ key }) => rating?.dimensions[key].score ?? 0);
	const polygonPoints = radarPointsFor(scores);
	const gridRings = [25, 50, 75, 100];

	return (
		<div className="mx-auto w-full max-w-[220px]" role="figure" aria-label="Pharos Safety Score radar chart for ZCHF">
			<svg viewBox={RADAR_VIEWBOX} className="h-auto w-full" aria-hidden="true">
				{gridRings.map((ring) => (
					<polygon
						key={ring}
						points={radarPointsFor(PHAROS_DIMENSIONS.map(() => ring))}
						fill="none"
						stroke="#D7DCE7"
						strokeWidth="1"
					/>
				))}
				{PHAROS_DIMENSIONS.map(({ shortLabel }, index) => {
					const axis = scoreToRadarPoint(index, 100);
					const label = scoreToRadarPoint(index, (RADAR_LABEL_RADIUS / RADAR_RADIUS) * 100);
					const anchor = label.x < RADAR_CENTER - 8 ? "end" : label.x > RADAR_CENTER + 8 ? "start" : "middle";
					return (
						<g key={shortLabel}>
							<line x1={RADAR_CENTER} y1={RADAR_CENTER} x2={axis.x} y2={axis.y} stroke="#E5E8F0" strokeWidth="1" />
							<text x={label.x} y={label.y + 4} textAnchor={anchor} className="fill-text-secondary text-[10px]">
								{shortLabel}
							</text>
						</g>
					);
				})}
				{!loading && rating ? (
					<>
						<polygon points={polygonPoints} fill="#3E96F4" fillOpacity="0.22" stroke="#0F80F0" strokeWidth="2.5" />
						{scores.map((score, index) => {
							const point = scoreToRadarPoint(index, score);
							return <circle key={PHAROS_DIMENSIONS[index].key} cx={point.x} cy={point.y} r="2.5" fill="#0F80F0" />;
						})}
					</>
				) : null}
			</svg>
		</div>
	);
}
