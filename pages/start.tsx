import Head from "next/head";
import { useState } from "react";
import { useConnection } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import AppTitle from "@components/AppTitle";
import BuyZchf from "@components/BuyZchf";
import StartPaths from "@components/PageStart/StartPaths";
import StartCalculator, { CalcGoal } from "@components/PageStart/StartCalculator";
import { track } from "../hooks/useAnalytics";
import Link from "next/link";

/**
 * /start — the first page a new visitor sees: three ways in, a calculator with real history, and the
 * three steps to take part. Wallet connection is step 2, not a precondition for reading the page.
 */
export default function StartPage() {
	const [goal, setGoal] = useState<CalcGoal>("save");
	const { isConnected } = useConnection();
	const AppKit = useAppKit();

	const steps = [
		{
			title: "Get ZCHF",
			body: "Buy on Kraken, by bank transfer from a Swiss or SEPA account, or swap from USDC, USDT or ETH.",
			action: (
				<a
					href="#buy-zchf"
					onClick={() => track("start_step_buy")}
					className="btn bg-button-default text-white hover:bg-button-hover py-2 text-sm"
				>
					See the options
				</a>
			),
		},
		{
			title: "Connect a wallet",
			body: "MetaMask, Rabby, Ledger, Coinbase Wallet or WalletConnect. ZCHF lives on Ethereum and seven other chains.",
			action: isConnected ? (
				<div className="text-text-success font-semibold text-sm text-center">Wallet connected ✓</div>
			) : (
				<button
					type="button"
					onClick={() => {
						track("start_step_connect");
						AppKit.open();
					}}
					className="btn bg-button-default text-white hover:bg-button-hover py-2 text-sm"
				>
					Connect wallet
				</button>
			),
		},
		{
			title: goal === "save" ? "Deposit into savings" : "Buy FCS",
			body:
				goal === "save"
					? "One transaction. Your balance and accrued interest show on the Earn page; withdraw whenever you want."
					: "One transaction. FCS lands in your wallet; sell on the market or redeem through the protocol later.",
			action: (
				<Link
					href={goal === "save" ? "/savings" : "/equity"}
					onClick={() => track(`start_step_${goal}`)}
					className="btn bg-button-default text-white hover:bg-button-hover py-2 text-sm"
				>
					{goal === "save" ? "Save ZCHF" : "Get FCS"}
				</Link>
			),
		},
	];

	return (
		<>
			<Head>
				<title>Frankencoin - Start</title>
			</Head>

			<AppTitle title="Start here">
				<div className="text-text-secondary">
					Take part in the digital Swiss franc: buy ZCHF, then save, invest or borrow. No account with Frankencoin: you keep your
					own keys.
				</div>
			</AppTitle>

			<div id="buy-zchf" className="scroll-mt-24">
				<AppTitle title="First: buy ZCHF">
					<div className="text-text-secondary">
						Everything here starts with Frankencoin (ZCHF) in your own wallet. Choose how you want to get it.
					</div>
				</AppTitle>
			</div>
			<BuyZchf variant="cards" source="start" />

			<AppTitle title="Then: put it to work">
				<div className="text-text-secondary">Three ways to use your ZCHF. Earn and Invest also drive the calculator below.</div>
			</AppTitle>
			<StartPaths goal={goal} onGoalChange={setGoal} />

			<AppTitle title="What would 5'000 be worth today?">
				<div className="text-text-secondary">
					Pick a goal and an amount. We use the protocol&apos;s recorded history, straight from the chain.
				</div>
			</AppTitle>
			<StartCalculator goal={goal} onGoalChange={setGoal} />

			<AppTitle title="Do it in three steps">
				<div className="text-text-secondary">About ten minutes the first time.</div>
			</AppTitle>
			<ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none m-0 p-0">
				{steps.map((s, i) => (
					<li key={i} className="flex flex-col gap-3 rounded-lg p-5 border border-card-input-border bg-card-body-primary">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-text-primary text-white text-sm font-bold">
							{i + 1}
						</span>
						<span className="font-bold text-text-primary">{s.title}</span>
						<p className="text-sm text-text-secondary flex-1">{s.body}</p>
						<div className="flex flex-col">{s.action}</div>
					</li>
				))}
			</ol>

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
