import type { NextApiRequest, NextApiResponse } from "next";
import { EnsoClient, RouteParams } from "@ensofinance/sdk";

// Server-side proxy so the Enso API key never reaches the browser bundle. Disabled until
// ENSO_API_KEY is configured — see utils/enso.ts for the client-side caller and the
// NEXT_PUBLIC_ENSO_SWAP_ENABLED flag that gates whether the UI calls this at all.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

	const apiKey = process.env.ENSO_API_KEY;
	if (!apiKey) return res.status(501).json({ error: "Enso swap execution is not configured (missing ENSO_API_KEY)" });

	try {
		const client = new EnsoClient({ apiKey });
		const data = await client.getRouteData(req.body as RouteParams);
		res.status(200).json(data);
	} catch (error: any) {
		res.status(502).json({ error: error?.message ?? "Enso route request failed" });
	}
}
