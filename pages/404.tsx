import Head from "next/head";
import { SOCIAL } from "@utils";
import AppLink from "@components/AppLink";

export default function Custom404() {
	return (
		<>
			<Head>
				<title>Frankencoin - 404</title>
			</Head>

			<div className="flex flex-col items-center justify-center w-full text-center" style={{ height: "60vh" }}>
				<h1 className="text-right text-4xl font-bold">
					<picture>
						<img src="/assets/logoSquare.svg" alt="logo" className="h-20" />
					</picture>
				</h1>
				<h1 className="text-4xl font-bold mt-10">You seem to be in the wrong place</h1>
				<AppLink
					className="mt-[4rem] -mb-[4rem]"
					label="Ping us on Github if you think this is a bug"
					href={SOCIAL.Github_dapp_new_issue}
					external={true}
				/>
			</div>
		</>
	);
}
