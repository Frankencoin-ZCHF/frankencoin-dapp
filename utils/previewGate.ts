/**
 * Minimal password gate for preview deployments. Active only when PREVIEW_PASSWORD is set, so
 * production (where it is unset) is untouched. Framework-agnostic: works on Web Request/Response
 * in Astro middleware and Next.js (edge) middleware alike.
 *
 * - No valid cookie → 401 with a small login form that POSTs back to the same URL.
 * - POST with the right password → 303 back to the same URL with an HttpOnly cookie (30 days).
 */
const COOKIE = "fc_preview";
const MAX_AGE = 30 * 24 * 3600;

async function token(password: string): Promise<string> {
	const data = new TextEncoder().encode(`fc-preview-v1|${password}`);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(header: string | null, name: string): string | undefined {
	return header
		?.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${name}=`))
		?.slice(name.length + 1);
}

function page(error: boolean): Response {
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Preview</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Avenir,system-ui,sans-serif;background:#f9fafc;color:#092f62}form{background:#fff;border:1px solid #dfe0e6;border-radius:16px;padding:32px;width:min(360px,90vw);display:grid;gap:12px}h1{font-size:20px;margin:0}p{margin:0;font-size:14px;color:#5d647b}input{font:inherit;padding:12px 14px;border:1px solid #dfe0e6;border-radius:10px}button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:999px;background:#0f80f0;color:#fff;cursor:pointer}.err{color:#e02523}</style></head>
<body><form method="post"><h1>Preview access</h1><p>This is a private preview. Enter the password to continue.</p>${
		error ? "<p class=err>Wrong password.</p>" : ""
	}<input type="password" name="password" autofocus autocomplete="current-password" placeholder="Password"><button type="submit">Enter</button></form></body></html>`;
	return new Response(html, { status: 401, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

/** Returns a Response to send instead of the page, or null to let the request through. */
export async function previewGate(request: Request, password: string | undefined): Promise<Response | null> {
	if (!password) return null;
	const expected = await token(password);
	if (readCookie(request.headers.get("cookie"), COOKIE) === expected) return null;

	if (request.method === "POST") {
		const form = await request.formData().catch(() => null);
		if (form?.get("password") === password) {
			return new Response(null, {
				status: 303,
				headers: {
					location: request.url,
					"set-cookie": `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
					"cache-control": "no-store",
				},
			});
		}
		return page(true);
	}
	return page(false);
}
