import { NextSeo } from "next-seo";

export default function NextSeoProvider() {
	return (
		<NextSeo
			title="dEURO"
			description="The dEURO is a collateralized, oracle-free stablecoin that tracks the value of the Swiss franc."
			openGraph={{
				type: "website",
				locale: "en_US",
				url: "https://app.deuro.com/",
			}}
			twitter={{
				handle: "@dEURO_com",
				site: "@dEURO_com",
				cardType: "summary_large_image",
			}}
			themeColor="#d35384"
			additionalLinkTags={[
				{
					rel: "icon",
					href: "/favicon.png",
					type: "image/png",
				},
			]}
		/>
	);
}
