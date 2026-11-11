import React, { useState } from "react";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import EquityInteractionWithZCHFFCS from "./EquityInteractionWithZCHFFCS";
import EquityInteractionWithFPSFCS from "./EquityInteractionWithFPSFCS";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";

// All possible paths (for reference):
// ZCHF: ["FPS", "FCS"],
// FPS: ["ZCHF", "WFPS", "FCS"],
// FCS: ["FPS", "ZCHF"],
// WFPS: ["FPS", "ZCHF"],
export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	ZCHF: ["FCS"],
	FPS: ["FCS"],
	FCS: ["ZCHF"],
	WFPS: ["FPS"],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({ from: "ZCHF", to: "FCS" });
	const involvesFcs = tokenFromTo.from === "FCS" || tokenFromTo.to === "FCS";

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">
				{involvesFcs ? "Frankencoin Shares (FCS)" : "Frankencoin Pool Shares (FPS)"}
			</div>

			{/* Load modules dynamically */}
			{(tokenFromTo.from === "ZCHF" && tokenFromTo.to === "FPS") || (tokenFromTo.from === "FPS" && tokenFromTo.to === "ZCHF") ? (
				<EquityInteractionWithZCHFFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === "FPS" && tokenFromTo.to === "WFPS") || (tokenFromTo.from === "WFPS" && tokenFromTo.to === "FPS") ? (
				<EquityInteractionWithFPSWFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{tokenFromTo.from === "WFPS" && tokenFromTo.to === "ZCHF" ? (
				<EquityInteractionWithWFPSRedeem
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === "ZCHF" && tokenFromTo.to === "FCS") || (tokenFromTo.from === "FCS" && tokenFromTo.to === "ZCHF") ? (
				<EquityInteractionWithZCHFFCS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === "FPS" && tokenFromTo.to === "FCS") || (tokenFromTo.from === "FCS" && tokenFromTo.to === "FPS") ? (
				<EquityInteractionWithFPSFCS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={setTokenFromTo}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			<div className="flex flex-wrap justify-center gap-x-6 gap-y-1 pt-2">
				<AppLink
					label="Trade FCS on Enso"
					href="https://app.enso.build/swap?fromChain=1&fromToken=0xdac17f958d2ee523a2206206994597c13d831ec7&toChain=1&toToken=0xdb861830d9ae2d1fcf99fa0cfd3973de382b0b5b"
					external
					icon
					className="flex items-center text-sm"
				/>
				<AppLink
					label="FCS Market Data on CoinGecko"
					href="https://www.coingecko.com/en/coins/frankencoin-shares"
					external
					icon
					className="flex items-center text-sm"
				/>
			</div>
		</AppCard>
	);
}
