import React, { useState } from "react";
import { useContractUrl } from "@hooks";
import { NATIVE_POOL_SHARE_TOKEN_SYMBOL, POOL_SHARE_TOKEN_SYMBOL, TOKEN_SYMBOL } from "@utils";
import { useChainId } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import InteractionStablecoinAndNativePS from "./InteractionStablecoinAndNativePS";
import InteractionNativePSAndPoolShareToken from "./InteractionNativePSAndPoolShareToken";
import InteractionPoolShareTokenRedeem from "./InteractionPoolShareTokenRedeem";
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
		};
		setTokenFromTo(adjustedSelection);
	};

	const chainId = useChainId();
	const wrappedPoolShareUrl = useContractUrl(ADDRESS[chainId].DEPSwrapper);

	return (
		<div className="bg-card-body-primary shadow-lg rounded-xl p-4 flex flex-col">
			<div className="mb-4 pb-2 justify-center items-center gap-1.5 inline-flex">
				<div className="text-text-title text-xl font-black ">dEURO Pool Shares</div>
			</div>

			{/* Load modules dynamically */}
			{(tokenFromTo.from === TOKEN_SYMBOL && tokenFromTo.to === NATIVE_POOL_SHARE_TOKEN_SYMBOL) ||
			(tokenFromTo.from === NATIVE_POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === TOKEN_SYMBOL) ? (
				<InteractionStablecoinAndNativePS
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{(tokenFromTo.from === NATIVE_POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === POOL_SHARE_TOKEN_SYMBOL) ||
			(tokenFromTo.from === POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === NATIVE_POOL_SHARE_TOKEN_SYMBOL) ? (
				<InteractionNativePSAndPoolShareToken
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			{tokenFromTo.from === POOL_SHARE_TOKEN_SYMBOL && tokenFromTo.to === TOKEN_SYMBOL ? (
				<InteractionPoolShareTokenRedeem
					tokenFromTo={tokenFromTo}
					setTokenFromTo={onTokenFromToChange}
					selectorMapping={EquityTokenSelectorMapping}
				/>
			) : null}

			<div className="mt-4">
				Also available as{" "}
				<Link href={wrappedPoolShareUrl} target="_blank" className="underline">
					{POOL_SHARE_TOKEN_SYMBOL}
				</Link>
			</div>
		</div>
	);
}
