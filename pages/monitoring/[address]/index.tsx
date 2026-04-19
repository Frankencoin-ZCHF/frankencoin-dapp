import Head from "next/head";
import { useRouter } from "next/router";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import AppTitle from "@components/AppTitle";
import MintingUpdatesTable from "@components/PageMonitoring/MintingUpdatesTable";
import AuctionCard from "@components/PageMonitoring/AuctionCard";
import StatRow from "@components/PageMonitoring/StatRow";
import { formatCurrency, formatDateTime, normalizeAddress, shortenAddress, DISCUSSIONS } from "@utils";
import { Address, formatUnits, zeroAddress } from "viem";
import { useContractUrl } from "@hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { FRANKENCOIN_API_CLIENT, WAGMI_CONFIG } from "../../../app.config";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { ApiMintingUpdateListing, MintingUpdateQuery } from "@frankencoin/api";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export default function PositionDetail() {
	const [reserve, setReserve] = useState<bigint>(0n);
	const [mintingUpdates, setMintingUpdates] = useState<MintingUpdateQuery[]>([]);

	const router = useRouter();
	const address = router.query.address as Address;
	const chainId = mainnet.id;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPositions = useSelector((state: RootState) => state.challenges.positions);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const position = positions.find((p) => normalizeAddress(p.position) === normalizeAddress(address));
	const challengesActive = (challengesPositions.map[normalizeAddress(address)] || []).filter((c) => c.status === "Active");

	const positionExplorerUrl = useContractUrl(String(address));
	const myPosLink = `/mypositions?address=${position?.owner || zeroAddress}`;

	useEffect(() => {
		if (!position) return;

		const fetchAsync = async () => {
			const reserveData = await readContract(WAGMI_CONFIG, {
				address: position.zchf,
				chainId,
				abi: FrankencoinABI,
				functionName: "calculateAssignedReserve",
				args: [BigInt(position.minted), position.reserveContribution],
			});
			setReserve(reserveData);

			const updates = await FRANKENCOIN_API_CLIENT.get<ApiMintingUpdateListing>(
				`/positions/mintingupdates/position/${position.version}/${normalizeAddress(position.position)}`
			);
			setMintingUpdates(updates.data.list ?? []);
		};

		fetchAsync();
	}, [position, chainId]);

	if (!position) return null;

	const isSubjectToCooldown = () => {
		const now = BigInt(Math.floor(Date.now() / 1000));
		return now < position.cooldown && position.cooldown < 32508005122n;
	};

	const priceDigit = 36 - position.collateralDecimals;
	const liqPriceFloat = parseFloat(formatUnits(BigInt(position.price), priceDigit));
	const marketPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf || 0;
	const nominalLTV = marketPriceChf > 0 ? (liqPriceFloat / marketPriceChf) * 100 : 0;

	const originalInfo =
		!position.isOriginal && position.original
			? { label: shortenAddress(position.original), href: `/monitoring/${position.original}` }
			: null;

	const statusBadge = () => {
		if (position.closed) return { label: "Closed", cls: "bg-red-500/20 text-red-400" };
		if (isSubjectToCooldown()) return { label: "Cooldown", cls: "bg-amber-500/20 text-amber-400" };
		return { label: "Active", cls: "bg-green-500/20 text-green-400" };
	};
	const status = statusBadge();

	return (
		<>
			<Head>
				<title>Frankencoin - Position Details</title>
			</Head>

			<div className="flex flex-col gap-4">
				{/* Header */}
				<AppTitle
					title={`${position.collateralName} (${position.collateralSymbol})`}
					subtitle={`Position details of ${position.position}.`}
					badges={[
						{ label: status.label, className: status.cls },
						{ label: `V${position.version}`, className: "bg-blue-500/20 text-blue-400" },
						...(position.isClone ? [{ label: "Clone", className: "bg-purple-500/20 text-purple-400" }] : []),
					]}
					actions={
						<div className="flex flex-wrap gap-4 text-sm">
							<AppLink label={`Owner`} href={myPosLink} external={false} />
							{originalInfo && <AppLink label={`Original`} href={originalInfo.href} external={false} />}
							{DISCUSSIONS[normalizeAddress(position.collateral)] && (
								<AppLink label={`Discussion`} href={DISCUSSIONS[normalizeAddress(position.collateral)]} external={true} />
							)}
							<AppLink label="Contract" href={positionExplorerUrl} external={true} />
						</div>
					}
				/>

				{/* Detail cards – 2-col desktop, 1-col mobile */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<AppCard>
						<div className="gap-2">
							<div className="text-base font-bold mb-1">Mint Details</div>
							<StatRow label="Minted">{formatCurrency(formatUnits(BigInt(position.minted), 18))} ZCHF</StatRow>
							<StatRow label="Retained Reserve">{formatCurrency(formatUnits(reserve, 18))} ZCHF</StatRow>
							<StatRow label="Available for Clones">
								{formatCurrency(formatUnits(BigInt(position.availableForClones), 18))} ZCHF
							</StatRow>
							<StatRow label="Limit">{formatCurrency(formatUnits(BigInt(position.limitForClones), 18))} ZCHF</StatRow>
						</div>
					</AppCard>

					<AppCard>
						<div className="gap-2">
							<div className="text-base font-bold mb-1">Collateral Details</div>
							<StatRow label="Balance">
								{formatCurrency(formatUnits(BigInt(position.collateralBalance), position.collateralDecimals))}{" "}
								{position.collateralSymbol}
							</StatRow>
							<StatRow label="Min. Collateral">
								{formatCurrency(formatUnits(BigInt(position.minimumCollateral), position.collateralDecimals))}{" "}
								{position.collateralSymbol}
							</StatRow>
							<StatRow label="Liquidation Price">
								{formatCurrency(formatUnits(BigInt(position.price), priceDigit))} ZCHF
							</StatRow>
							<StatRow label="Nominal LTV">
								<span className={nominalLTV > 90 ? "text-red-400" : nominalLTV > 80 ? "text-amber-400" : "text-green-400"}>
									{formatCurrency(nominalLTV, 2, 2)}%
								</span>
							</StatRow>
						</div>
					</AppCard>

					<AppCard>
						<div className="gap-2">
							<div className="text-base font-bold mb-1">Terms</div>
							<StatRow label="Annual Interest">{formatCurrency(position.annualInterestPPM / 10000, 2, 2)}%</StatRow>
							<StatRow label="Reserve Requirement">{formatCurrency(position.reserveContribution / 10000, 2, 2)}%</StatRow>
							<StatRow label="Auction Duration">{position.challengePeriod / 3600} hours</StatRow>
						</div>
					</AppCard>

					<AppCard>
						<div className="gap-2">
							<div className="text-base font-bold mb-1">Lifecycle</div>
							<StatRow label="Start">{formatDateTime(position.isOriginal ? position.start : position.created)}</StatRow>
							<StatRow label="Expiration">
								<span className={position.closed ? "text-red-400" : ""}>
									{position.closed ? "Closed" : formatDateTime(position.expiration)}
								</span>
							</StatRow>
							{isSubjectToCooldown() && (
								<StatRow label="Cooldown Until">
									<span className="text-amber-400">{formatDateTime(position.cooldown)}</span>
								</StatRow>
							)}
						</div>
					</AppCard>

					{isSubjectToCooldown() && (
						<AppCard>
							<div className="gap-2">
								<div className="text-base font-bold text-amber-400 mb-1">Cooldown Active</div>
								<p className="text-text-secondary text-sm leading-relaxed">
									The owner recently raised the liquidation price. This position is in a cooldown period until{" "}
									<span className="text-text-primary font-medium">{formatDateTime(position.cooldown)}</span>. During this
									time the position can be challenged before additional ZCHF can be minted.
								</p>
							</div>
						</AppCard>
					)}

					<div className={isSubjectToCooldown() ? "" : "md:col-span-2"}>
						<AppCard>
							<AppTitle
								className="!pt-0"
								classNameTitle="text-base"
								title="Active Auctions"
								badges={[
									{
										label: String(challengesActive.length),
										className:
											challengesActive.length > 0
												? "bg-red-500/20 text-red-400"
												: "bg-card-content-primary text-text-secondary",
									},
								]}
							/>
							{challengesActive.length === 0 ? (
								<p className="text-text-secondary text-sm">This position is currently not being challenged.</p>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{challengesActive.map((c, idx) => (
										<AuctionCard key={c.id || `auction_${idx}`} position={position} challenge={c} />
									))}
								</div>
							)}
						</AppCard>
					</div>
				</div>

				{/* Position History – full width */}
				<div>
					<AppTitle
						title="Position History"
						subtitle="A chronological record of all price, minting and collateral adjustments for this position."
						className="pb-4"
					/>
					<MintingUpdatesTable updates={mintingUpdates} position={position} />
				</div>
			</div>
		</>
	);
}
