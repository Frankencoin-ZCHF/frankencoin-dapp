import { NextRequest, NextResponse } from "next/server";
import { isCollateralBlockedForCountry } from "./utils/geoBlocking";

// Only runs on pages that are keyed by a collateral address in the URL.
export const config = {
	matcher: ["/mint/:path*", "/monitoring/:path*", "/mypositions/:path*"],
};

export function middleware(request: NextRequest) {
	const [, address] = request.nextUrl.pathname.split("/").filter(Boolean);
	if (!address) return NextResponse.next();

	// Set by Cloudflare when the "IP Geolocation" feature is enabled for the zone.
	const country = request.headers.get("cf-ipcountry");
	const blocked = isCollateralBlockedForCountry(address, country);
	console.log(`[geoBlocking] path=${request.nextUrl.pathname} address=${address} country=${country} blocked=${blocked}`);

	if (blocked) {
		return new NextResponse("This asset is not available in your region.", { status: 451 });
	}

	return NextResponse.next();
}
