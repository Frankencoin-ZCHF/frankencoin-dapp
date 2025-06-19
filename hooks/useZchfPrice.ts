import { UniswapV3PoolABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";
import { useReadContract } from "wagmi";

export const useZchfPrice = () => {
	const { data } = useReadContract({
		abi: UniswapV3PoolABI,
		chainId: mainnet.id,
		address: "0x8E4318E2cb1ae291254B187001a59a1f8ac78cEF",
		functionName: "slot0",
	});

	const sqrtPriceX96 = data ? Number(data[0]) : 0;

	const zchfPrice = ((sqrtPriceX96 * sqrtPriceX96) / 2 ** 192) * 10 ** 12;

	return parseFloat(zchfPrice.toFixed(4));
};
