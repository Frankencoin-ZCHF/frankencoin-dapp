import { Html, Head, Main, NextScript } from "next/document";
import { Analytics } from "@vercel/analytics/react";

export default function Document() {
	return (
		<Html lang="en">
			<Head></Head>
			<body className="font-default container-xl mx-auto bg-layout-primary text-text-primary font-medium">
				<Main />
				<NextScript />
				<Analytics />
			</body>
		</Html>
	);
}
