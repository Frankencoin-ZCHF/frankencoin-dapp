import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import ChainLogo from "@components/ChainLogo";
import LoadingSpin from "@components/LoadingSpin";
import RollingNumber from "@components/RollingNumber";
import { ContractUrl, formatCurrency, shortenAddress } from "@utils";
import { SavingsChainAccount, usePageVisible } from "@hooks";
import { useEffect, useRef, useState } from "react";
import { Address, formatUnits, zeroAddress } from "viem";
import { ChainId } from "@frankencoin/zchf";
import SavingsActionRedeem from "./SavingsActionRedeem";

interface Props {
	account: Address;
	accounts: SavingsChainAccount[];
	isLoading: boolean;
	updatedAt: number;
	readOnly: boolean;
	selectedChainId: ChainId;
	onSelectChain?: (chainId: ChainId) => void;
}

export default function SavingsOverviewCard({ account, accounts, isLoading, updatedAt, readOnly, selectedChainId, onSelectChain }: Props) {
	const active = accounts.filter((a) => a.saved > 0n || a.interest > 0n);

	return (
		<AppCard>
			<div className="text-lg font-bold text-center">{readOnly ? `Savings of ${shortenAddress(account)}` : "Your savings"}</div>
			<div className="p-4 flex flex-col gap-2">
				{account != zeroAddress ? (
					<div className="mb-6">
						<SavingsTotal accounts={active} updatedAt={updatedAt} />
					</div>
				) : null}

				{account == zeroAddress ? (
					<div className="text-text-secondary text-center">Connect your wallet to see your savings.</div>
				) : isLoading ? (
					<div className="flex justify-center">
						<LoadingSpin />
					</div>
				) : active.length == 0 ? (
					<div className="text-text-secondary text-center">No savings on any chain yet.</div>
				) : (
					active.map((a) => (
						<SavingsChainRow
							key={a.chain.id}
							savings={a}
							selected={a.chain.id == selectedChainId}
							onSelect={onSelectChain ? () => onSelectChain(a.chain.id as ChainId) : undefined}
						/>
					))
				)}

				{!readOnly ? (
					<div className="flex mt-6">
						<SavingsActionRedeem owner={account} />
					</div>
				) : null}
			</div>
		</AppCard>
	);
}

interface SavingsTotalProps {
	accounts: SavingsChainAccount[];
	updatedAt: number;
}

const YEAR_MS = 365n * 24n * 60n * 60n * 1000n;

// Splits a wei amount into whole francs (with thousands separators) and a fixed number of truncated decimals
const splitAmount = (wei: bigint, decimals: number): [string, string] => {
	const [whole, fraction = ""] = formatUnits(wei, 18).split(".");
	return [whole.replace(/\B(?=(\d{3})+(?!\d))/g, " "), fraction.padEnd(decimals, "0").slice(0, decimals)];
};

/**
 * The total is extrapolated between contract reads from each chain's principal, rate and referral fee,
 * so it visibly grows. Six decimals while interest accrues, two otherwise.
 */
function SavingsTotal({ accounts, updatedAt }: SavingsTotalProps) {
	const visible = usePageVisible();
	const [now, setNow] = useState(0);
	const shown = useRef<{ total: bigint; principal: bigint }>({ total: 0n, principal: 0n });

	const yearly = accounts.reduce((sum, a) => sum + a.yearlyInterest, 0n);
	const principal = accounts.reduce((sum, a) => sum + a.saved, 0n);

	useEffect(() => {
		if (!visible || updatedAt == 0 || yearly == 0n) return;
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), 100);
		return () => clearInterval(id);
	}, [visible, updatedAt, yearly]);

	const elapsedMs = updatedAt > 0 && now > updatedAt ? BigInt(now - updatedAt) : 0n;
	const growth = accounts.reduce((sum, a) => {
		const accruingMs = elapsedMs - a.lockedSeconds * 1000n;
		return accruingMs > 0n ? sum + (a.yearlyInterest * accruingMs) / YEAR_MS : sum;
	}, 0n);

	let total = accounts.reduce((sum, a) => sum + a.withdrawable, 0n) + growth;
	let interest = accounts.reduce((sum, a) => sum + a.netInterest, 0n) + growth;

	// contract reads are a few seconds behind the wall clock, never let a refresh tick the number backwards
	const lag = shown.current.total - total;
	if (shown.current.principal == principal && lag > 0n && lag < (yearly * 60_000n) / YEAR_MS) {
		total += lag;
		interest += lag;
	}
	shown.current = { total, principal };

	// only chains past the three-day delay count towards the live ticking
	const accruingYearly = accounts.reduce((sum, a) => (a.lockedSeconds * 1000n <= elapsedMs ? sum + a.yearlyInterest : sum), 0n);
	const perSecond = Number(formatUnits(accruingYearly, 18)) / (365 * 24 * 60 * 60);
	const decimals = perSecond > 0 ? 6 : 2;
	// digits changing more than twice a second can't roll smoothly, those flip in place like a stopwatch
	const changesPerSecond = perSecond * 10 ** decimals;
	const flipDigits = changesPerSecond > 2 ? Math.ceil(Math.log10(changesPerSecond / 2)) : 0;
	const [whole, fraction] = splitAmount(total, decimals);

	return (
		<div className="flex flex-col items-center gap-1">
			<div className="flex items-end">
				<RollingNumber value={whole} className="text-3xl font-extrabold text-text-primary" />
				<RollingNumber
					value={`.${fraction}`}
					flipDigits={flipDigits}
					className="text-xl font-bold text-text-secondary mb-[0.1em]"
				/>
				<span className="text-xl font-bold text-text-secondary ml-2 mb-[0.1em] leading-[1.15em]">ZCHF</span>
			</div>
			<div className="flex items-center gap-2 text-sm text-text-secondary">
				{interest > 0n ? (
					<>
						{perSecond > 0 ? (
							<span className="relative flex h-2 w-2" title="Interest is accruing">
								<span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-text-success opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-text-success" />
							</span>
						) : null}
						<span>
							incl. <span className="text-text-success font-semibold">+{formatCurrency(formatUnits(interest, 18))} ZCHF</span>{" "}
							accrued interest
						</span>
					</>
				) : (
					"No accrued interest"
				)}
			</div>
		</div>
	);
}

interface SavingsChainRowProps {
	savings: SavingsChainAccount;
	selected: boolean;
	onSelect?: () => void;
}

function SavingsChainRow({ savings, selected, onSelect }: SavingsChainRowProps) {
	const { chain, withdrawable, netInterest, referrer, referralFeePPM, referralFee, lockedSeconds } = savings;
	const clickable = onSelect != undefined && !selected;

	return (
		<div
			className={`rounded-lg px-3 py-2 flex flex-col gap-1 ${selected ? "bg-card-content-primary" : ""} ${
				clickable ? "cursor-pointer hover:bg-card-content-primary" : ""
			}`}
			onClick={clickable ? onSelect : undefined}
		>
			<div className="flex items-center gap-2">
				<ChainLogo chain={chain.name} size={5} />
				<div className="flex-1 font-semibold">{chain.name}</div>
				<div className="font-semibold">{formatCurrency(formatUnits(withdrawable, 18))} ZCHF</div>
			</div>

			<div className="flex text-sm pl-7">
				<div className="flex-1 text-text-secondary">Accrued interest</div>
				<div className="text-text-secondary">{formatCurrency(formatUnits(netInterest, 18))} ZCHF</div>
			</div>

			{referrer != zeroAddress ? (
				<div className="flex text-sm pl-7">
					<div className="flex-1 text-text-secondary">
						Referrer{" "}
						<span onClick={(e) => e.stopPropagation()}>
							<AppLink className="" label={shortenAddress(referrer)} href={ContractUrl(referrer, chain)} external={true} />
						</span>{" "}
						receives {Number(referralFeePPM) / 10_000}% of interest
					</div>
					<div className="text-text-secondary">{formatCurrency(formatUnits(referralFee, 18))} ZCHF</div>
				</div>
			) : null}

			{lockedSeconds > 0n ? (
				<div className="text-sm pl-7 text-text-secondary">
					Interest starts to accrue in {formatCurrency(Number(lockedSeconds) / 3600)} hours.
				</div>
			) : null}
		</div>
	);
}
