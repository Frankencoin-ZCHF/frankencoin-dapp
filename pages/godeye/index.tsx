import Head from "next/head";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// canvas + ResizeObserver only exist in the browser
const GodEyeView = dynamic(() => import("@components/PageGodEye/GodEyeView"), { ssr: false });

export default function GodEyePage() {
	// fullscreen cockpit: Layout renders no navbar/footer for this route, so lock the page scroll
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	return (
		<div>
			<Head>
				<title>Frankencoin - GodEye</title>
			</Head>
			<div className="fixed inset-0 bg-[#05070d]">
				<GodEyeView />
			</div>
		</div>
	);
}
