import { PositionQuery } from "@frankencoin/api";

// A position becomes force-sellable once it expires while still open, undenied and holding collateral.
export function isForceSellable(position: PositionQuery, nowMs: number = Date.now()): boolean {
	return !position.denied && !position.closed && BigInt(position.collateralBalance) > 0n && nowMs > position.expiration * 1000;
}

// Mirrors the two-phase declining price curve of MintingHubV2.expiredPurchasePrice (10x -> 1x -> 0),
// so it can be estimated client-side without a contract read.
export function getForceSellPrice(position: PositionQuery, nowMs: number = Date.now()): bigint {
	const liqPrice = BigInt(position.price);
	const startMs = position.expiration * 1000;
	const phaseMs = position.challengePeriod * 1000;
	const phase2StartMs = startMs + phaseMs;
	const auctionEndMs = startMs + 2 * phaseMs;

	if (nowMs <= startMs) return liqPrice * 10n;
	if (phaseMs <= 0 || nowMs >= auctionEndMs) return 0n;

	if (nowMs < phase2StartMs) {
		const elapsed = BigInt(Math.floor(nowMs - startMs));
		return liqPrice * 10n - (liqPrice * 9n * elapsed) / BigInt(phaseMs);
	}

	const elapsed = BigInt(Math.floor(nowMs - phase2StartMs));
	return liqPrice - (liqPrice * elapsed) / BigInt(phaseMs);
}

export function getForceSellAuctionEnd(position: PositionQuery): number {
	return position.expiration + 2 * position.challengePeriod;
}
