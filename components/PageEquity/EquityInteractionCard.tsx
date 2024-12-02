import React, { useState } from "react";
import { useContractUrl } from "@hooks";
import { NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL } from "@utils";
import { useChainId } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import EquityInteractionWithZCHFFPS from "./EquityInteractionWithZCHFFPS";
import EquityInteractionWithFPSWFPS from "./EquityInteractionWithFPSWFPS";
import EquityInteractionWithWFPSRedeem from "./EquityInteractionWithWFPSRedeem";
import { ADDRESS } from "@deuro/eurocoin";

export const EquityTokenSelectorMapping: { [key: string]: string[] } = {
	[TOKEN_SYMBOL]: [NATIVE_POOL_SHARE_TOKEN_SYMBOL],
	[NATIVE_POOL_SHARE_TOKEN_SYMBOL]: [TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL],
	[POOL_SHARE_TOKEN_SYMBOL]: [NATIVE_POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL],
};

export default function EquityInteractionCard() {
	const [tokenFromTo, setTokenFromTo] = useState<{ from: string; to: string }>({
		from: TOKEN_SYMBOL,
		to: NATIVE_POOL_SHARE_TOKEN_SYMBOL,
	});

	const onTokenFromToChange = (newSelection: { from: string; to: string }) => {
		const toTokenOptions = EquityTokenSelectorMapping[newSelection.from];
		const isToTokenAvailable = toTokenOptions.includes(newSelection.to);
		const adjustedSelection = {
			from: newSelection.from,
			to: isToTokenAvailable ? newSelection.to : toTokenOptions[0],
		}		
		setTokenFromTo(adjustedSelection);
	};

	const chainId = useChainId();
	const equityUrl = useContractUrl(ADDRESS[chainId].equity);

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
			<Link href={equityUrl} target="_blank">
				<div className="mt-4 text-lg font-bold underline text-center">
					Decentralized Euro Pool Shares ({NATIVE_POOL_SHARE_TOKEN_SYMBOL})
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
				</div>
			</Link>

			{/* Load modules dynamically */}
			{(tokenFromTo.from === TOKEN_SYMBOL && tokenFromTo.to === NATIVE_POOL_SHARE_TOKEN_SYMBOL) ||
			(tokenFromTo.from === NATIVE_POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === TOKEN_SYMBOL) ? (
				<EquityInteractionWithZCHFFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === NATIVE_POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === POOL_SHARE_TOKEN_SYMBOL) ||
			(tokenFromTo.from === POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === NATIVE_POOL_SHARE_TOKEN_SYMBOL) ? (
				<EquityInteractionWithFPSWFPS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{tokenFromTo.from === POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === TOKEN_SYMBOL ? (
				<EquityInteractionWithWFPSRedeem
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
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
					{POOL_SHARE_TOKEN_SYMBOL}
				</Link>
			</div>
		</div>
	);
}
