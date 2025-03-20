import React, { useState } from "react";
import { ContractUrl, SOCIAL } from "@utils";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import AppLink from "@components/AppLink";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../../app.config";

export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	ZCHF: ["FPS"],
	FPS: ["ZCHF", "WFPS"],
	WFPS: ["FPS", "ZCHF"],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({ from: "ZCHF", to: "FPS" });
	const { wFPS } = ADDRESS[WAGMI_CHAIN.id];

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
			<div className="mt-4 text-lg font-bold text-center">Frankencoin Pool Shares (FPS)</div>

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
		</div>
	);
}
