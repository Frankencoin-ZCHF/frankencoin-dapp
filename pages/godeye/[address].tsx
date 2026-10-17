import Head from "next/head";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// canvas + ResizeObserver only exist in the browser
const GodEyeJourneyView = dynamic(() => import("@components/PageGodEye/GodEyeJourneyView"), { ssr: false });

export default function GodEyeJourneyPage() {
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
				<title>Frankencoin - GodEye Timeline</title>
			</Head>
			<div className="fixed inset-0 bg-[#05070d]">
				<GodEyeJourneyView />
			</div>
		</div>
	);
}
