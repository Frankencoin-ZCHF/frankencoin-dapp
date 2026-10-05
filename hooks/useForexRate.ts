import { formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { useReadContracts } from "wagmi";
import { ADDRESS, OCR2AggregatorABI } from "@frankencoin/zchf";

// Chainlink CHF / USD price feed on Ethereum mainnet (8 decimals). Forex feeds move
// slowly (deviation threshold / daily heartbeat), so polling once a minute is plenty.
const CHAINLINK_CHF_USD_FEED = ADDRESS[mainnet.id].chainlinkOCR2Aggregator;
const REFETCH_INTERVAL = 60_000;

export type ForexRate = {
	isLoading: boolean;
	usdPerChf: number; // 0 while unknown
	chfPerUsd: number; // 0 while unknown
	updatedAt: number; // unix seconds of the feed's last update, 0 while unknown
};

/**
 * The CHF/USD forex reference rate from Chainlink, independent of any ZCHF market
 * price. Used to show how far a ZCHF/USD pool trades from the real exchange rate.
 */
export const useChfUsdRate = (): ForexRate => {
	const { data, isLoading } = useReadContracts({
		contracts: [
			{ chainId: mainnet.id, address: CHAINLINK_CHF_USD_FEED, abi: OCR2AggregatorABI, functionName: "decimals" },
			{ chainId: mainnet.id, address: CHAINLINK_CHF_USD_FEED, abi: OCR2AggregatorABI, functionName: "latestRoundData" },
		],
		query: { refetchInterval: REFETCH_INTERVAL },
	});

	const decimals = data?.[0]?.status === "success" ? Number(data[0].result) : 8;
	const round = data?.[1]?.status === "success" ? data[1].result : undefined;
	const answer = round ? round[1] : 0n;
	const usdPerChf = answer > 0n ? Number(formatUnits(answer, decimals)) : 0;

	return {
		isLoading,
		usdPerChf,
		chfPerUsd: usdPerChf > 0 ? 1 / usdPerChf : 0,
		updatedAt: round ? Number(round[3]) : 0,
	};
};
