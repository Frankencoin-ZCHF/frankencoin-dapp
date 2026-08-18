import Head from "next/head";
import { SOCIAL } from "@utils";
import AppLink from "@components/AppLink";

export default function Restricted() {
	return (
		<>
			<Head>
				<title>Frankencoin - Restricted</title>
			</Head>

			<div className="flex flex-col items-center justify-center w-full text-center" style={{ height: "60vh" }}>
				<h1 className="text-right text-4xl font-bold">
					<picture>
						<img src="/assets/logoSquare.svg" alt="logo" className="h-20" />
					</picture>
				</h1>
				<h1 className="text-4xl font-bold mt-10">Not available in your region</h1>
				<p className="mt-4 max-w-lg text-text-secondary">
					The resource you are trying to request is not available in your region due to jurisdictional restrictions.
				</p>
				<AppLink
					className="mt-[4rem] -mb-[4rem]"
					label="Questions? Ping us on Github"
					href={SOCIAL.Github_dapp_new_issue}
					external={true}
				/>
			</div>
		</>
	);
}
