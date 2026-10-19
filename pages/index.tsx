import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * New visitors land on /start (paths, calculator, steps) instead of the Borrow table.
 * The redirect itself is static (next.config.js `redirects`); this is only the client fallback.
 */
export default function MainPage() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/start");
	}, [router]);
	return null;
}
