import { useSwapStats } from "@hooks";
import { SOCIAL, formatCurrency } from "@utils";
import Link from "next/link";
import TokenLogo from "@components/TokenLogo";

export default function StableCoinBridgeXCHF() {
	const swapStats = useSwapStats();

	const expirationTimestamp = 1729980479000;
	const limit = parseInt(swapStats.bridgeLimit.toString()) / 10 ** 18;
	const minted = parseInt(swapStats.xchfBridgeBal.toString()) / 10 ** 18;
	const ratio = Math.round((minted / limit) * 10000) / 100;
	const expiration = Math.round(((expirationTimestamp - Date.now()) / 1000 / 60 / 60 / 24) * 100) / 100;
	const statusText =
		expiration < 30
			? `Danger, ${expiration} days left`
			: expiration < 60
			? `Warning, ${expiration} days left`
			: `Safe, ${expiration} days left`;
	const statusColor = expiration < 30 ? "bg-red-500" : expiration < 60 ? "bg-orange-400" : "bg-green-500";

	return (
		<div className="bg-card-body-primary rounded-2xl p-8">
			<div className="grid grid-cols-3 gap-4">
				<TokenLogo currency={swapStats.xchfSymbol.toLowerCase()} />
				<div className="col-span-2 text-2xl font-bold mb-10">Stablecoin Bridge ({swapStats.xchfSymbol})</div>
			</div>

			<div className="mb-5">
				This Stablecoin Bridge facilitates the conversion between the Crypto Franc (XCHF) stablecoin and Frankencoin (ZCHF). The
				bridge contract was initialized with a{" "}
				<span className="front-bold font-semibold text-card-content-highlight">
					maximum minting limit of {formatCurrency(limit.toString(), 2)} ZCHF
				</span>
				, representing the upper bound for the amount of ZCHF that can be minted through this bridge.{" "}
				<a href="https://docs.frankencoin.com/swap" target="_blank" rel="noreferrer" className="justify-center underline">
					Read more
				</a>
			</div>

			<div className="mb-[2rem]">
				Currently, the available{" "}
				<span className="front-bold font-semibold text-card-content-highlight">
					liquidity for swaps is {formatCurrency(minted.toString(), 2)} XCHF
				</span>
				, which corresponds to the available{" "}
				<span className="front-bold font-semibold text-card-content-highlight">
					liquidity of {formatCurrency((limit - minted).toString(), 2)} ZCHF
				</span>
				. This amount constitutes to{" "}
				<span className="front-bold font-semibold text-card-content-highlight">{ratio}% of the maximum minting limit</span>{" "}
				established for this bridge.{" "}
				<span className="front-bold font-semibold text-card-content-highlight">
					This bridge will expire on {new Date(expirationTimestamp).toDateString()}
				</span>
				.
			</div>

			<div className="lg:flex lg:flex-row mb-[2rem]">
				<div className="mx-auto max-w-full flex-col">
					<Link href={`/swap`} className="btn btn-primary h-2  w-72">
						Make a Swap
					</Link>
				</div>

				<div className="mx-auto max-w-full flex-col h-2 w-72">
					<a
						href={SOCIAL.Uniswap_Mainnet}
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-center underline"
					>
						Also available on
						<picture>
							<img src="/assets/uniswap.svg" alt="logo" className="w-6 mb-2 mx-1" />
						</picture>
						Uniswap.
					</a>
				</div>
			</div>

			<div className={`bg-gray-200 rounded-full text-center max-h-7 max-w-[100] text-gray-900 font-bold ${statusColor}`}>
				{statusText}
			</div>
		</div>
	);
}
