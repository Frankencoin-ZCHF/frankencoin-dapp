import { useMemo } from "react";
import { useSelector } from "react-redux";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import AppToggle from "@components/AppToggle";
import AddressLabel from "@components/AddressLabel";
import TokenLogo from "@components/TokenLogo";
import { Address } from "viem";
import { normalizeAddress, shortenAddress, formatBigInt, formatCurrency, FormatType } from "@utils";
import { RootState, store } from "../../redux/redux.store";
import { TelegramAlertType, toggleTelegramAlert } from "../../redux/slices/telegram.slice";

const NOTIFICATION_TOGGLES: { type: TelegramAlertType; label: string }[] = [
	{ type: "weeklyInfo", label: "Weekly Info" },
	{ type: "newPosition", label: "New Positions / Denied" },
	{ type: "positionExpiry", label: "Position Expiry" },
	{ type: "challenge", label: "Challenged / Bids" },
	{ type: "newMinter", label: "New Minter / Denied" },
	{ type: "mintingUpdates", label: "Minting Updates" },
	{ type: "priceAlerts", label: "Price Alerts" },
	{ type: "equityEvents", label: "Equity / Reserve Events" },
	{ type: "ccipProposal", label: "CCIP Proposals" },
	{ type: "savingsRate", label: "Savings Rate Proposals" },
	{ type: "mintingRate", label: "Minting Rate Proposals" },
];

export function TelegramAlertsPanel() {
	const { linked, alerts } = useSelector((state: RootState) => state.telegram);
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const { coingecko } = useSelector((state: RootState) => state.prices);

	const isEnabled = (type: TelegramAlertType, address = "") => alerts.some((a) => a.type === type && a.address === address);

	const toggle = (type: TelegramAlertType, address = "") => {
		store.dispatch(toggleTelegramAlert(type, address) as any);
	};

	const positionsByCollateral = useMemo(() => {
		type PosEntry = { address: string; collateralBalance: string };
		const map = new Map<string, { collateral: string; symbol: string; collateralDecimals: number; positions: PosEntry[] }>();
		openPositions.forEach((p) => {
			const collateral = normalizeAddress(p.collateral);
			if (!map.has(collateral))
				map.set(collateral, { collateral, symbol: p.collateralSymbol, collateralDecimals: p.collateralDecimals, positions: [] });
			map.get(collateral)!.positions.push({ address: normalizeAddress(p.position), collateralBalance: p.collateralBalance });
		});
		return [...map.values()]
			.sort((a, b) => b.positions.length - a.positions.length)
			.map((group) => {
				const priceChf = coingecko[group.collateral]?.price?.chf ?? 0;
				const sorted = [...group.positions].sort((a, b) => {
					const val = (pos: PosEntry) => (Number(BigInt(pos.collateralBalance)) / 10 ** group.collateralDecimals) * priceChf;
					return val(b) - val(a);
				});
				return { ...group, positions: sorted };
			});
	}, [openPositions, coingecko]);

	const uniqueOwners = useMemo(() => {
		const map = new Map<string, { address: string; positionCount: number; totalChf: number }>();
		openPositions.forEach((p) => {
			const owner = normalizeAddress(p.owner);
			const priceChf = coingecko[normalizeAddress(p.collateral)]?.price?.chf ?? 0;
			const chfValue = (Number(BigInt(p.collateralBalance)) / 10 ** p.collateralDecimals) * priceChf;
			if (!map.has(owner)) map.set(owner, { address: owner, positionCount: 0, totalChf: 0 });
			const entry = map.get(owner)!;
			entry.positionCount += 1;
			entry.totalChf += chfValue;
		});
		return [...map.values()].sort((a, b) => b.totalChf - a.totalChf);
	}, [openPositions, coingecko]);

	const uniqueCollaterals = useMemo(
		() =>
			[...new Map(openPositions.map((p) => [normalizeAddress(p.collateral), p.collateralSymbol])).entries()].map(
				([address, symbol]) => ({ address, symbol })
			),
		[openPositions]
	);

	if (!linked) return null;

	return (
		<div className="flex flex-col gap-4">
			{/* Notifications */}
			<AppCard className="flex flex-col gap-3 px-4 py-3">
				<div className="font-bold text-sm">Notifications</div>
				<div className="columns-1 md:columns-2 lg:columns-3 gap-x-4">
					{NOTIFICATION_TOGGLES.map(({ type, label }) => (
						<div key={type} className="break-inside-avoid mb-2">
							<AppToggle label={label} enabled={isEnabled(type)} onChange={() => toggle(type)} />
						</div>
					))}
				</div>
			</AppCard>

			{/* Positions — grouped by collateral */}
			<AppCard className="flex flex-col gap-3 px-4 py-3">
				<div className="font-bold text-sm">Positions</div>
				{positionsByCollateral.length === 0 ? (
					<div className="text-text-secondary text-sm">No open positions</div>
				) : (
					<div className="columns-1 md:columns-2 gap-x-6">
						{positionsByCollateral.map(({ collateral, symbol, collateralDecimals, positions }) => (
							<div key={collateral} className="flex flex-col gap-2 break-inside-avoid mb-4">
								<div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">
									<TokenLogo currency={symbol.toLowerCase()} size={5} />
									{symbol}
								</div>
								{positions.map(({ address, collateralBalance }) => {
									const collFloat = Number(BigInt(collateralBalance)) / 10 ** collateralDecimals;
									const priceChf = coingecko[collateral]?.price?.chf ?? 0;
									const collAmt = formatBigInt(BigInt(collateralBalance), collateralDecimals, 2);
									const chfAmt = formatCurrency(collFloat * priceChf, 0, 0, FormatType.symbol);
									return (
										<div key={address} className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1 text-xs min-w-0">
												<span className="whitespace-nowrap">{collAmt} {symbol}</span>
												<span className="text-text-secondary">·</span>
												<span className="whitespace-nowrap">{chfAmt} ZCHF</span>
												<span className="text-text-secondary">·</span>
												<AppLink label={shortenAddress(address as Address)} href={`/monitoring/${address}`} />
											</div>
											<AppToggle label="" enabled={isEnabled("position", address)} onChange={() => toggle("position", address)} />
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</AppCard>

			{/* Owners */}
			<AppCard className="flex flex-col gap-2 px-4 py-3">
				<div className="font-bold text-sm">Owners</div>
				{uniqueOwners.length === 0 ? (
					<div className="text-text-secondary text-sm">No owners found</div>
				) : (
					<div className="columns-1 md:columns-2 gap-x-4">
						{uniqueOwners.map(({ address, positionCount, totalChf }) => (
							<div key={address} className="flex items-center justify-between gap-2 break-inside-avoid mb-2">
								<div className="flex items-center gap-1 text-xs min-w-0">
									<span className="whitespace-nowrap">Positions: {positionCount}</span>
									<span className="text-text-secondary">·</span>
									<span className="whitespace-nowrap">Value: {formatCurrency(totalChf, 0, 0, FormatType.symbol)} ZCHF</span>
									<span className="text-text-secondary">·</span>
									<AppLink label={shortenAddress(address as Address)} href={`/mypositions?address=${address}`} />
								</div>
								<AppToggle label="" enabled={isEnabled("owner", address)} onChange={() => toggle("owner", address)} />
							</div>
						))}
					</div>
				)}
			</AppCard>

			{/* Collaterals */}
			<AppCard className="flex flex-col gap-2 px-4 py-3">
				<div className="font-bold text-sm">Collaterals</div>
				{uniqueCollaterals.length === 0 ? (
					<div className="text-text-secondary text-sm">No collaterals found</div>
				) : (
					<div className="columns-1 md:columns-2 gap-x-4">
						{uniqueCollaterals.map(({ address, symbol }) => (
							<div key={address} className="flex items-center justify-between break-inside-avoid mb-2">
								<div className="flex items-center gap-2">
									<TokenLogo currency={symbol.toLowerCase()} size={5} />
									<span className="text-xs text-text-secondary">{symbol}</span>
									<span className="text-xs"><AddressLabel address={address as Address} showLink /></span>
								</div>
								<AppToggle label="" enabled={isEnabled("collateral", address)} onChange={() => toggle("collateral", address)} />
							</div>
						))}
					</div>
				)}
			</AppCard>
		</div>
	);
}
