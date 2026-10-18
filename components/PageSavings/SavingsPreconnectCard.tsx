import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import { formatCurrency } from "@utils";
import { track } from "../../hooks/useAnalytics";

interface Props {
	/** yearly rate in percent, e.g. 3.5 */
	rate: number;
}

/**
 * Shown on /savings before a wallet is connected. Instead of an empty "connect to adjust" box it answers
 * the question people actually have: what does X ZCHF earn here? Connect is the action, not the precondition.
 */
export default function SavingsPreconnectCard({ rate }: Props) {
	const AppKit = useAppKit();
	const [amount, setAmount] = useState(5000);
	const yearly = (amount * rate) / 100;

	return (
		<AppCard>
			<div className="text-lg font-bold text-center">Start saving</div>
			<label className="flex flex-col gap-1">
				<span className="text-xs tracking-wider font-bold text-card-input-label">IF YOU DEPOSIT</span>
				<span className="flex rounded-xl border border-card-input-border overflow-hidden focus-within:border-card-input-focus">
					<input
						type="text"
						inputMode="decimal"
						size={6}
						className="w-full min-w-0 flex-1 px-4 py-3 text-2xl font-bold text-text-primary outline-none bg-transparent"
						value={formatCurrency(amount, 0, 0) ?? ""}
						onChange={(e) => {
							const n = Number(e.target.value.replace(/[^\d.]/g, ""));
							setAmount(Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0);
						}}
					/>
					<span className="px-4 flex items-center font-bold bg-card-content-primary text-text-primary border-l border-card-input-border">
						ZCHF
					</span>
				</span>
			</label>
			<div className="grid grid-cols-3 gap-2 text-center">
				{[
					{ label: "per year", v: yearly },
					{ label: "per month", v: yearly / 12 },
					{ label: "per day", v: yearly / 365 },
				].map((x) => (
					<div key={x.label} className="rounded-lg bg-card-content-primary p-3">
						<div className="text-xl font-black text-text-primary">+{formatCurrency(x.v, 0, 2)}</div>
						<div className="text-xs text-text-secondary">ZCHF {x.label}</div>
					</div>
				))}
			</div>
			<div className="text-xs text-text-secondary text-center">
				At the current rate of {rate.toFixed(2).replace(/\.?0+$/, "")}% a year, set by governance. Interest accrues every block;
				withdraw any time.
			</div>
			<button
				type="button"
				onClick={() => {
					track("savings_preconnect_connect");
					AppKit.open();
				}}
				className="btn bg-button-default text-white hover:bg-button-hover py-2"
			>
				Connect wallet to deposit
			</button>
			<div className="text-center text-sm">
				<AppLink
					className=""
					label="No ZCHF yet? Buy by bank transfer (0% fees)"
					href="https://www.mtpelerin.com/buy-zchf-frankencoin"
					external
				/>
			</div>
		</AppCard>
	);
}
