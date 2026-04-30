import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<Script
					defer
					src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
					data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
					strategy="afterInteractive"
				/>
			</Head>
			<body className="font-default container-xl mx-auto bg-layout-primary text-text-primary font-medium">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
