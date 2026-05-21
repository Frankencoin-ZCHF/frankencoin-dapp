import Head from "next/head";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AppCard from "@components/AppCard";
import { useRatings } from "../hooks/useRatings";
import type { XerberusEntityType } from "./api/ratings/list";

const HOW_IT_WORKS = [
	{
		n: 1,
		title: "Independent",
		body: "Ratings are produced by Xerberus, an external open-source protocol, not by the Frankencoin DAO.",
	},
	{
		n: 2,
		title: "Open Methodology",
		body: "Every calculation is public and documented. No black-box algorithms, no hidden biases. Full intellectual transparency.",
	},
	{
		n: 3,
		title: "Verifiable Sources",
		body: "Because the math is open, the data must be too. Xerberus pulls directly from on-chain truth to feed its models. Trust, but verify.",
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

const xerberusReportUrl = (type: XerberusEntityType, id: string) => {
	if (type === "pool") return `https://app.xerberus.io/pool/dendrogram/${id}`;
	return "https://app.xerberus.io";
};

export default function RatingsPage() {
	const { data, loading, error } = useRatings({
		types: Array.from(new Set(RATING_CARDS.map((c) => c.type))),
	});

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
					, an open-source on-chain risk-rating protocol with no affiliation to Frankencoin. Each score below reflects a
					transparent, automated analysis of public on-chain data.
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
