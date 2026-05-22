import type { NextApiRequest, NextApiResponse } from "next";

export type PharosDimensionKey = "pegStability" | "liquidity" | "resilience" | "decentralization" | "dependencyRisk";

export type PharosDimensionRating = {
	grade: string;
	score: number | null;
	detail: string;
};

export type PharosRating = {
	id: "zchf-frankencoin";
	name: string;
	symbol: string;
	overallGrade: string;
	overallScore: number | null;
	methodologyVersion: string | null;
	updatedAt: number | null;
	dimensions: Record<PharosDimensionKey, PharosDimensionRating>;
};

type SuccessBody = { status: "success"; data: PharosRating };
type ErrorBody = { status: "error"; message: string };

const PHAROS_STABLECOIN_ID = "zchf-frankencoin";
const DEFAULT_PHAROS_API_URL = "https://api.pharos.watch";
const PHAROS_CACHE_TTL_MS = 5 * 60 * 1000;
const PHAROS_STALE_TTL_MS = PHAROS_CACHE_TTL_MS + 30 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 8 * 1000;
const ENABLE_DEV_MOCKS = process.env.NODE_ENV !== "production";

const DIMENSION_KEYS: PharosDimensionKey[] = ["pegStability", "liquidity", "resilience", "decentralization", "dependencyRisk"];

let pharosCache: { fetchedAt: number; rating: PharosRating } | null = null;

const DEV_MOCK_RATING: PharosRating = {
	id: PHAROS_STABLECOIN_ID,
	name: "Frankencoin",
	symbol: "ZCHF",
	overallGrade: "A-",
	overallScore: 84,
	methodologyVersion: "7.13",
	updatedAt: 1771977600,
	dimensions: {
		pegStability: {
			grade: "A",
			score: 88,
			detail: "Stable CHF peg behavior with limited recent deviation.",
		},
		liquidity: {
			grade: "B+",
			score: 79,
			detail: "Usable exit liquidity across tracked venues and routes.",
		},
		resilience: {
			grade: "A-",
			score: 84,
			detail: "Overcollateralized minting model with diversified accepted collateral.",
		},
		decentralization: {
			grade: "A",
			score: 87,
			detail: "Governance and minting controls are materially on-chain.",
		},
		dependencyRisk: {
			grade: "B",
			score: 76,
			detail: "Some collateral and venue exposure remains externally dependent.",
		},
	},
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const stringOrFallback = (value: unknown, fallback: string): string => {
	return typeof value === "string" ? value : fallback;
};

const numberOrNull = (value: unknown): number | null => {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			throw new Error(`Upstream request timed out after ${timeoutMs}ms`);
		}
		throw err;
	} finally {
		clearTimeout(timeout);
	}
};

const setSuccessCacheHeaders = (res: NextApiResponse) => {
	res.setHeader("Cache-Control", "public, s-maxage=300, max-age=60, stale-while-revalidate=1800");
};

const sendCachedRating = (
	res: NextApiResponse<SuccessBody | ErrorBody>,
	cache: { fetchedAt: number; rating: PharosRating },
	stale: boolean
) => {
	setSuccessCacheHeaders(res);
	res.setHeader("X-Pharos-Cache", stale ? "stale" : "hit");
	if (stale) res.setHeader("Warning", '110 - "Response is stale"');
	return res.status(200).json({ status: "success", data: cache.rating });
};

function parsePharosRating(body: unknown): PharosRating | null {
	if (!isRecord(body) || !Array.isArray(body.cards)) return null;

	const card = body.cards.find((candidate) => {
		return isRecord(candidate) && candidate.id === PHAROS_STABLECOIN_ID;
	});
	if (!isRecord(card) || !isRecord(card.dimensions)) return null;

	const rawDimensions = card.dimensions;
	const dimensions = DIMENSION_KEYS.reduce((acc, key) => {
		const rawDimension = rawDimensions[key];
		if (!isRecord(rawDimension)) {
			acc[key] = { grade: "NR", score: null, detail: "Dimension unavailable" };
			return acc;
		}

		acc[key] = {
			grade: stringOrFallback(rawDimension.grade, "NR"),
			score: numberOrNull(rawDimension.score),
			detail: stringOrFallback(rawDimension.detail, "Dimension unavailable"),
		};
		return acc;
	}, {} as Record<PharosDimensionKey, PharosDimensionRating>);

	const methodology = isRecord(body.methodology) ? body.methodology : null;

	return {
		id: PHAROS_STABLECOIN_ID,
		name: stringOrFallback(card.name, "Frankencoin"),
		symbol: stringOrFallback(card.symbol, "ZCHF"),
		overallGrade: stringOrFallback(card.overallGrade, "NR"),
		overallScore: numberOrNull(card.overallScore),
		methodologyVersion: methodology ? stringOrFallback(methodology.version, "") || null : null,
		updatedAt: numberOrNull(body.updatedAt),
		dimensions,
	};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessBody | ErrorBody>) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ status: "error", message: "Method Not Allowed" });
	}

	const apiKey = process.env.PHAROS_API_KEY;
	if (!apiKey) {
		if (ENABLE_DEV_MOCKS) {
			setSuccessCacheHeaders(res);
			res.setHeader("X-Ratings-Mock", "pharos");
			return res.status(200).json({ status: "success", data: DEV_MOCK_RATING });
		}

		return res.status(500).json({
			status: "error",
			message: "Pharos API is not configured (PHAROS_API_KEY).",
		});
	}

	const baseUrl = process.env.PHAROS_API_URL || DEFAULT_PHAROS_API_URL;
	const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/api/report-cards`;
	const now = Date.now();
	if (pharosCache && now - pharosCache.fetchedAt < PHAROS_CACHE_TTL_MS) {
		return sendCachedRating(res, pharosCache, false);
	}

	try {
		const upstream = await fetchWithTimeout(
			upstreamUrl,
			{
				method: "GET",
				headers: {
					"X-API-Key": apiKey,
					accept: "application/json",
				},
			},
			UPSTREAM_TIMEOUT_MS
		);

		const body = (await upstream.json().catch(() => null)) as unknown;

		if (!upstream.ok) {
			const message = isRecord(body) && typeof body.error === "string" ? body.error : `Upstream request failed (${upstream.status})`;
			if (pharosCache && now - pharosCache.fetchedAt < PHAROS_STALE_TTL_MS) {
				return sendCachedRating(res, pharosCache, true);
			}
			return res.status(upstream.status || 502).json({ status: "error", message });
		}

		const rating = parsePharosRating(body);
		if (!rating) {
			if (pharosCache && now - pharosCache.fetchedAt < PHAROS_STALE_TTL_MS) {
				return sendCachedRating(res, pharosCache, true);
			}
			return res.status(404).json({ status: "error", message: "Pharos rating for ZCHF was not found." });
		}

		pharosCache = { fetchedAt: Date.now(), rating };
		setSuccessCacheHeaders(res);
		res.setHeader("X-Pharos-Cache", "miss");
		return res.status(200).json({ status: "success", data: rating });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error contacting Pharos API";
		if (pharosCache && now - pharosCache.fetchedAt < PHAROS_STALE_TTL_MS) {
			return sendCachedRating(res, pharosCache, true);
		}
		return res.status(502).json({ status: "error", message });
	}
}
