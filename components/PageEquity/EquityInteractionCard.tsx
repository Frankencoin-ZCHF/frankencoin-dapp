import React, { useState } from "react";
import { useContractUrl } from "@hooks";
import { SOCIAL } from "@utils";
import { useChainId } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import { ADDRESS } from "@frankencoin/zchf";

export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	ZCHF: ["FPS"],
	FPS: ["ZCHF", "WFPS"],
	WFPS: ["FPS", "ZCHF"],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({ from: "ZCHF", to: "FPS" });

	const chainId = useChainId();
	const equityUrl = useContractUrl(ADDRESS[chainId].equity);

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
			<Link href={equityUrl} target="_blank">
				<div className="mt-4 text-lg font-bold underline text-center">
					Frankencoin Pool Shares (FPS)
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
				</div>
			</Link>

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

			<div className="mt-4">
				Also available as{" "}
				<Link
					href={"https://etherscan.io/address/0x5052d3cc819f53116641e89b96ff4cd1ee80b182"}
					target="_blank"
					className="underline"
				>
					WFPS
				</Link>{" "}
				for{" "}
				<Link href={SOCIAL.Uniswap_WFPS_Polygon} target="_blank" className="underline">
					trading on Polygon
				</Link>
			</div>
		</div>
	);
}
