import Head from "next/head";
import Link from "next/link";
import { SOCIAL } from "@utils";

export default function Custom404() {
	return (
		<main className="container-xl mx-auto">
			<Head>
				<title>dEURO - 404</title>
			</Head>

			{/* To load dynamic classes */}
			<div className="hidden w-10 h-10" />
			<div className="flex flex-col items-center justify-center w-full text-center" style={{ height: "60vh" }}>
				<h1 className="text-right text-4xl font-bold">
					<picture>
						<img src="/assets/logo.svg" alt="logo" className="h-20" />
					</picture>
				</h1>
				<h1 className="text-4xl font-bold mt-10">You seem to be in the wrong place</h1>
				<p className="text-2xl font-bold mt-4">
					<Link
						href={SOCIAL.Telegram}
						className="mr-4 hover:underline md:mr-6 text-rose-500"
						target="_blank"
						rel="noopener noreferrer"
					>
						Ping us on Telegram if you think this is a bug
					</Link>
				</p>
			</div>
		</main>
	);
}
