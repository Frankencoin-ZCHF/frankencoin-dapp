import { Html, Head, Main, NextScript } from "next/document";
import { Analytics } from "@vercel/analytics/react";

export default function Document() {
	return (
		<Html lang="en">
			<Head></Head>
			<body className="font-sans px-0 md:px-8 max-w-screen-2xl container-xl mx-auto bg-layout-primary text-text-primary">
				<Main />
				<NextScript />
				<Analytics />
			</body>
		</Html>
	);
}
