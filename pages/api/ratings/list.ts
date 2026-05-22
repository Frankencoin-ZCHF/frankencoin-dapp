import type { NextApiRequest, NextApiResponse } from "next";

export type XerberusEntityType = "pool" | "protocol" | "organisation" | "asset";

export type XerberusRating = {
	type: XerberusEntityType;
	id: string;
	name: string;
	score: number | null;
	platform: string | null;
	address: string | null;
};

type SuccessBody = { status: "success"; data: XerberusRating[] };
type ErrorBody = { status: "error"; message: string };

const ALLOWED_TYPES: XerberusEntityType[] = ["pool", "protocol", "organisation", "asset"];
const UPSTREAM_TIMEOUT_MS = 8 * 1000;
const ENABLE_DEV_MOCKS = process.env.NODE_ENV !== "production";

const DEV_MOCK_RATINGS: XerberusRating[] = [
	{
		type: "protocol",
		id: "frankencoin",
		name: "Frankencoin",
		score: 91,
		platform: null,
		address: null,
	},
	{
		type: "organisation",
		id: "frankencoin-dao",
		name: "Frankencoin",
		score: 87,
		platform: null,
		address: null,
	},
	{
		type: "pool",
		id: "frankencoin-savings-eth",
		name: "Frankencoin Savings",
		score: 83,
		platform: "ethereum",
		address: null,
	},
];

const parseCsv = (raw: unknown): string[] | undefined => {
	if (typeof raw !== "string" || raw.length === 0) return undefined;
	const parts = raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	return parts.length > 0 ? parts : undefined;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessBody | ErrorBody>) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ status: "error", message: "Method Not Allowed" });
	}

	const types = parseCsv(req.query.type);
	if (types && types.some((t) => !ALLOWED_TYPES.includes(t as XerberusEntityType))) {
		return res.status(400).json({
			status: "error",
			message: `type must be one or more of: ${ALLOWED_TYPES.join(", ")} (comma-separated)`,
		});
	}

	const baseUrl = process.env.XERBERUS_API_URL;
	const apiKey = process.env.XERBERUS_API_KEY;
	const userEmail = process.env.XERBERUS_USER_EMAIL;

	if (!baseUrl || !apiKey || !userEmail) {
		if (ENABLE_DEV_MOCKS) {
			res.setHeader("X-Ratings-Mock", "xerberus");
			return res.status(200).json({
				status: "success",
				data: types ? DEV_MOCK_RATINGS.filter((rating) => types.includes(rating.type)) : DEV_MOCK_RATINGS,
			});
		}

		return res.status(500).json({
			status: "error",
			message: "Xerberus API is not configured (XERBERUS_API_URL, XERBERUS_API_KEY, XERBERUS_USER_EMAIL).",
		});
	}

	const params = new URLSearchParams();
	if (types) params.set("type", types.join(","));

	const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/registry/scores${params.toString() ? `?${params.toString()}` : ""}`;

	try {
		const upstream = await fetchWithTimeout(
			upstreamUrl,
			{
				method: "GET",
				headers: {
					"x-api-key": apiKey,
					"x-user-email": userEmail,
					accept: "application/json",
				},
			},
			UPSTREAM_TIMEOUT_MS
		);

		const body = (await upstream.json().catch(() => null)) as SuccessBody | ErrorBody | null;

		if (!upstream.ok || !body || body.status !== "success") {
			const message = body && "message" in body ? body.message : `Upstream request failed (${upstream.status})`;
			return res.status(upstream.status || 502).json({ status: "error", message });
		}

		return res.status(200).json(body);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error contacting Xerberus API";
		return res.status(502).json({ status: "error", message });
	}
}
