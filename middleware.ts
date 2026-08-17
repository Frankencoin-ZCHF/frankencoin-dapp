import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { isCollateralBlockedForCountry } from "./utils/geoBlocking";

// Only runs on pages that are keyed by a position address in the URL.
export const config = {
	matcher: ["/mint/:path*", "/monitoring/:path*", "/mypositions/:path*"],
};

// Mirrors app.config.ts's mainnet transport. Positions in this app are mainnet-only
// (all three matched pages hardcode chainId = mainnet.id), so no chain lookup needed.
const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_KEY || "dhaKbi2HDlKYW1JaSHm1i_hGkE2gnA5t"}`;

// Minimal fragment instead of importing the full Position ABI from @frankencoin/zchf -
// the function selector for collateral() is identical across V1/V2 positions.
const COLLATERAL_ABI = [
	{
		inputs: [],
		name: "collateral",
		outputs: [{ type: "address" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });

async function resolveCollateralForPosition(positionAddress: `0x${string}`): Promise<string | undefined> {
	try {
		return await publicClient.readContract({
			address: positionAddress,
			abi: COLLATERAL_ABI,
			functionName: "collateral",
		});
	} catch {
		return undefined;
	}
}

export async function middleware(request: NextRequest) {
	const [, address] = request.nextUrl.pathname.split("/").filter(Boolean);
	if (!address || !isAddress(address)) return NextResponse.next();

	const collateral = await resolveCollateralForPosition(address);
	if (!collateral) return NextResponse.next();

	// Set by Cloudflare when the "IP Geolocation" feature is enabled for the zone.
	const country = request.headers.get("cf-ipcountry");
	const blocked = isCollateralBlockedForCountry(collateral, country);
	console.log(
		`[geoBlocking] path=${request.nextUrl.pathname} position=${address} collateral=${collateral} country=${country} blocked=${blocked}`
	);

	if (blocked) {
		return NextResponse.rewrite(new URL("/restricted", request.url));
	}

	return NextResponse.next();
}
