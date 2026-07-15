import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Address, isAddress, zeroAddress } from "viem";
import AppButton from "@components/AppButton";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import AppLink from "@components/AppLink";
import AmplifierSummary from "@components/PageAmplifier/AmplifierSummary";
import AmplifierPoolChart from "@components/PageAmplifier/AmplifierPoolChart";
import AmplifierPositionsTable from "@components/PageAmplifier/AmplifierPositionsTable";
import { AmplifierPositionAction } from "@components/PageAmplifier/AmplifierPositionRow";
import AmplifierPositionAddDialog from "@components/PageAmplifier/AmplifierPositionAddDialog";
import AmplifierPositionRemoveDialog from "@components/PageAmplifier/AmplifierPositionRemoveDialog";
import AmplifierPositionCollectDialog from "@components/PageAmplifier/AmplifierPositionCollectDialog";
import AmplifierPositionCreateDialog from "@components/PageAmplifier/AmplifierPositionCreateDialog";
import AppSelect from "@components/AppSelect";
import { AmplifiedPositionInfo, useAmplifier, useAmplifiedPositions, useContractUrl } from "@hooks";
import { getPriceView } from "../../hooks/useAmplifier";
import { isDateExpired, shortenAddress } from "@utils";
import { TEST_AMPLIFIER } from "../../utils/amplifierConstants";

export default function AmplifierPage() {
	const router = useRouter();
	const param = router.query.contract as string;
	const amplifier: Address | undefined = param && isAddress(param) ? param : undefined;
	const paramAddr = router.query.address as string;
	const overwrite: Address | undefined = paramAddr && isAddress(paramAddr) ? paramAddr : undefined;

	const stats = useAmplifier(amplifier);

	// base currency of the displayed numbers: CHF (prices as ZCHF per USD, the default)
	// or USD (prices as USD per ZCHF), remembered across visits
	const [priceBase, setPriceBase] = useState("CHF");
	useEffect(() => {
		if (localStorage.getItem("amplifier-price-base") === "USD") setPriceBase("USD");
	}, []);
	const priceView = getPriceView(stats, priceBase === "USD");
	const changePriceBase = (base: string) => {
		setPriceBase(base);
		localStorage.setItem("amplifier-price-base", base);
	};

	// positions created in this session, remembered across navigation because
	// the Aktionariat API only picks up new contracts with a delay
	const storageKey = amplifier ? `amplifier-created-${amplifier.toLowerCase()}` : undefined;
	const [createdPositions, setCreatedPositions] = useState<Address[]>([]);
	useEffect(() => {
		if (!storageKey) return;
		try {
			setCreatedPositions(JSON.parse(sessionStorage.getItem(storageKey) ?? "[]"));
		} catch {}
	}, [storageKey]);

	const { positions, isLoading, apiError } = useAmplifiedPositions(amplifier, createdPositions, overwrite);
	const amplifierUrl = useContractUrl(amplifier ?? zeroAddress);
	const usdUrl = useContractUrl(stats.usd ?? zeroAddress);
	const poolUrl = `https://app.uniswap.org/explore/pools/ethereum/${stats.pool}`;

	const [dialog, setDialog] = useState<{ action: AmplifierPositionAction; position: AmplifiedPositionInfo } | null>(null);
	const [showCreate, setShowCreate] = useState(false);

	// keep an open dialog fed with the position's per-block refreshed state
	const dialogPosition = dialog
		? positions.find((p) => p.address.toLowerCase() === dialog.position.address.toLowerCase()) ?? dialog.position
		: undefined;

	const expired = stats.expiration > 0n && isDateExpired(stats.expiration);
	const isTestAmplifier = amplifier != undefined && amplifier.toLowerCase() === TEST_AMPLIFIER.toLowerCase();

	if (router.isReady && !amplifier) {
		return (
			<AppCard>
				<div className="text-lg font-bold text-center mt-4">Uniswap Amplifier</div>
				<div>
					No amplifier contract provided. Open this page with the address of a deployed UniswapAmplifier, e.g.{" "}
					<span className="font-mono">/amplifier?contract=0x...</span>, or try the{" "}
					<AppLink className="" label="test amplifier" href={`/amplifier?contract=${TEST_AMPLIFIER}`} />.
				</div>
			</AppCard>
		);
	}

	if (amplifier && stats.invalid) {
		return (
			<AppCard>
				<div className="text-lg font-bold text-center mt-4">Uniswap Amplifier</div>
				<div>
					The contract <AppLink className="" label={shortenAddress(amplifier)} href={amplifierUrl} external={true} /> does not
					seem to be a UniswapAmplifier on Ethereum mainnet.
				</div>
			</AppCard>
		);
	}

	return (
		<>
			<Head>
				<title>Frankencoin - Amplifier</title>
			</Head>

			{/* Section Amplifier Overview */}
			<AppTitle
				title="Uniswap Amplifier"
				subtitle={
					<>
						The <AppLink className="" label="amplifier" href={amplifierUrl} external={true} /> lets you provide liquidity to the{" "}
						<AppLink
							className=""
							label={`${stats.zchfSymbol} / ${stats.usdSymbol || "..."} Uniswap pool`}
							href={poolUrl}
							external={true}
						/>{" "}
						while only supplying{" "}
						<AppLink className="" label={stats.usdSymbol || "the paired token"} href={usdUrl} external={true} /> — the{" "}
						{stats.zchfSymbol} side is borrowed from the Frankencoin protocol, cutting the capital costs of liquidity
						provisioning in half.
					</>
				}
				actions={
					<AppSelect
						className="w-40"
						options={[
							{ value: "CHF", label: "Base CHF" },
							{ value: "USD", label: "Base USD" },
						]}
						value={priceBase}
						onChange={changePriceBase}
					/>
				}
			/>

			{isTestAmplifier && (
				<div className="mt-4 rounded-lg bg-card-content-primary p-4 text-text-secondary">
					This is the test amplifier. It does not actually mint {stats.zchfSymbol}, but still uses real ZCHF supplied by volunteer
					that must be returned by closing all positions before the amplifier expires.
				</div>
			)}

			<AmplifierSummary stats={stats} priceView={priceView} />

			<div className="mt-4">
				<AmplifierPoolChart stats={stats} priceView={priceView} positions={positions} overwrite={overwrite} />
			</div>

			{/* Section Positions */}
			<AppTitle
				title="Amplified Positions"
				subtitle="All positions created through this amplifier. Yours (if any) are listed first."
				actions={
					<AppButton className="h-10 px-4" width="w-auto" disabled={expired} onClick={() => setShowCreate(true)}>
						Create Position
					</AppButton>
				}
			/>

			{expired && (
				<div className="mt-4 text-text-warning">
					This amplifier has expired. Anyone can now close remaining positions and collect their liquidity at the owners&apos;
					expense, so you should withdraw yours now.
				</div>
			)}

			<div className="mt-4">
				<AmplifierPositionsTable
					stats={stats}
					priceView={priceView}
					positions={positions}
					isLoading={isLoading}
					apiError={apiError}
					overwrite={overwrite}
					onAction={(action, position) => setDialog({ action, position })}
				/>
			</div>

			{/* Dialogs for state changes */}
			{dialog && dialogPosition && dialog.action === "add" && (
				<AmplifierPositionAddDialog stats={stats} priceView={priceView} position={dialogPosition} onClose={() => setDialog(null)} />
			)}
			{dialog && dialogPosition && dialog.action === "remove" && (
				<AmplifierPositionRemoveDialog stats={stats} position={dialogPosition} onClose={() => setDialog(null)} />
			)}
			{dialog && dialogPosition && dialog.action === "collect" && (
				<AmplifierPositionCollectDialog stats={stats} position={dialogPosition} onClose={() => setDialog(null)} />
			)}
			{showCreate && (
				<AmplifierPositionCreateDialog
					stats={stats}
					priceView={priceView}
					onClose={() => setShowCreate(false)}
					onCreated={(position) => {
						if (storageKey) {
							sessionStorage.setItem(storageKey, JSON.stringify([...createdPositions, position]));
						}
						setCreatedPositions((current) => [...current, position]);
					}}
				/>
			)}
		</>
	);
}
