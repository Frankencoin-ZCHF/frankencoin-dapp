import Head from "next/head";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import AppTitle from "@components/AppTitle";
import StartDashboard from "@components/PageStart/StartDashboard";
import { track } from "../hooks/useAnalytics";
import Link from "next/link";

/**
 * /start — the overview: the user's own numbers (ZCHF, savings, borrowing, FCS) next to how the product
 * performs, each with the action that leads further. The route keeps its name so existing links and the
 * redirect from "/" keep working.
 */
export default function StartPage() {
	const { isConnected } = useConnection();
	const AppKit = useAppKit();

	return (
		<>
			<Head>
				<title>Frankencoin - Overview</title>
			</Head>

			<AppTitle title="Overview">
				<div className="text-text-secondary">
					Your Frankencoin at a glance: what you hold, save, borrow and own, and how each has performed.{" "}
					{isConnected ? null : (
						<button
							type="button"
							onClick={() => {
								track("overview_connect");
								AppKit.open();
							}}
							className="font-semibold text-card-input-max hover:text-card-input-hover"
						>
							Connect your wallet
						</button>
					)}
					{isConnected ? null : " to see your numbers."}
				</div>
			</AppTitle>

			<StartDashboard />

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
				{[
					{ label: "Audits", value: "4 independent audits", href: "https://frankencoin.com/compliance" },
					{ label: "Legal", value: "Swiss law & MiCAR", href: "https://frankencoin.com/compliance" },
					{ label: "Reserves", value: "Every position on-chain", href: "/monitoring" },
					{ label: "Cover", value: "Optional de-peg insurance", href: "https://frankencoin.com/insurance" },
				].map((t) => (
					<Link
						key={t.label}
						href={t.href}
						target={t.href.startsWith("http") ? "_blank" : "_self"}
						className="flex flex-col gap-0.5 rounded-lg border border-card-input-border bg-card-body-primary px-4 py-3 hover:border-card-input-hover"
					>
						<span className="text-xs tracking-wider font-bold text-text-secondary">{t.label.toUpperCase()}</span>
						<span className="font-semibold text-text-primary">{t.value}</span>
					</Link>
				))}
			</div>
		</>
	);
}
