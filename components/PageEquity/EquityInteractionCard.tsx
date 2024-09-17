import React, { useState } from "react";
import { useContractUrl } from "@hooks";
import { SOCIAL } from "@utils";
import { useChainId } from "wagmi";
import { ADDRESS } from "@contracts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Select from "react-select";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import EquityInteractionWithFPSUnlock from "./EquityInteractionWithFPSUnlock";

export const EquityInteractionCardOptions = [
	{ value: "zchffps1", label: "Invest ZCHF and Redeem FPS" }, // invest: ZCHF -> FPS, redeem: FPS -> ZCHF (90days lock)
	{ value: "fpswfps1", label: "Wrap FPS and Unwrap WFPS" }, // wrap and unwrap
	{ value: "wfpsredeem1", label: "Redeem WFPS for ZCHF" }, // unwrapAndSell: WFPS -> ZCHF (avg. 90days lock)
	{ value: "fpsunlock1", label: "Unlock FPS for ZCHF (beta)" }, // unlock and sell
];

export default function EquityInteractionCard() {
	const [interactionWith, setInteractionWith] = useState(EquityInteractionCardOptions[0]);
	const chainId = useChainId();
	const equityUrl = useContractUrl(ADDRESS[chainId].equity);

	return (
		<div className="bg-slate-950 rounded-xl p-4 flex flex-col">
			<Link href={equityUrl} target="_blank">
				<div className="mt-4 text-lg font-bold underline text-center">
					Frankencoin Pool Shares (FPS)
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
				</div>
			</Link>

			<div className="mt-8">
				<Select
					className="mt-1"
					options={EquityInteractionCardOptions}
					defaultValue={EquityInteractionCardOptions[0]}
					value={interactionWith}
					onChange={(o) => o && setInteractionWith(o)}
					styles={{
						control: (baseStyles, state) => ({
							...baseStyles,
							backgroundColor: "#1e293b",
							color: "#e2e8f0",
							borderRadius: "1rem", // This makes the main control rounder
							borderColor: "#1e293b",
						}),
						option: (baseStyles, state) => ({
							...baseStyles,
							backgroundColor: state.isFocused ? "#2c3e50" : "#1e293b",
							color: "#e2e8f0",
						}),
						singleValue: (baseStyles) => ({
							...baseStyles,
							color: "#e2e8f0",
						}),
						menu: (baseStyles) => ({
							...baseStyles,
							backgroundColor: "#1e293b",
							borderRadius: "1rem", // This rounds the dropdown menu
							overflow: "hidden", // This ensures the content doesn't overflow the rounded corners
						}),
					}}
				/>
			</div>

			{interactionWith.value == EquityInteractionCardOptions[0].value ? <EquityInteractionWithZCHFFPS /> : null}
			{interactionWith.value == EquityInteractionCardOptions[1].value ? <EquityInteractionWithFPSWFPS /> : null}
			{interactionWith.value == EquityInteractionCardOptions[2].value ? <EquityInteractionWithWFPSRedeem /> : null}
			{interactionWith.value == EquityInteractionCardOptions[3].value ? <EquityInteractionWithFPSUnlock /> : null}

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
