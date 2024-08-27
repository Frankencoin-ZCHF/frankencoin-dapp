import Head from "next/head";
import Link from "next/link";
import { SOCIAL } from "@utils";

export default function SavingsPage() {
	return (
		<main className="section">
			<Head>
				<title>Frankencoin - Savings</title>
			</Head>

			<div className="flex flex-col items-center justify-center w-full text-center" style={{ height: "60vh" }}>
				<h1 className="text-right text-xl font-bold">
					<picture>
						<img src="/assets/logo.svg" alt="logo" className="h-20" />
					</picture>
				</h1>
				<p className="text-md mt-[5rem] md:mx-[5rem]">
					Frankencoin Association is working on a new module to allow users to earn a positive interest on their Frankencoin
					holdings by locking them for a certain amount of time. This module will be made accessible through this page. In the
					meantime, you might also want to consider <Link href="/pool">buying Frankencoin Pool Shares</Link>, which are more risky
					put potentially also offer a higher reward when the system grows.
				</p>
			</div>
		</main>
	);
}
