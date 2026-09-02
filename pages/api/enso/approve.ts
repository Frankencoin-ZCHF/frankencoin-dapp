import type { NextApiRequest, NextApiResponse } from "next";
import { ApproveParams, EnsoClient } from "@ensofinance/sdk";

// Server-side proxy so the Enso API key never reaches the browser bundle. 501s until
// ENSO_API_KEY is configured — see utils/enso.ts for the client-side caller.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

	const apiKey = process.env.ENSO_API_KEY;
	if (!apiKey) return res.status(501).json({ error: "Enso swap execution is not configured (missing ENSO_API_KEY)" });

	try {
		const client = new EnsoClient({ apiKey });
		const data = await client.getApprovalData(req.body as ApproveParams);
		res.status(200).json(data);
	} catch (error: any) {
		res.status(502).json({ error: error?.message ?? "Enso approval request failed" });
	}
}
