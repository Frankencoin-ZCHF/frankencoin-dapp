import { useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export const useHoldingDurationStats = () => {
	const equityContract = {
		address: ADDRESS[mainnet.id].equity,
		chainId: mainnet.id,
		abi: EquityABI,
	};

	const { data } = useReadContracts({
		contracts: [
			{
				...equityContract,
				functionName: "totalSupply",
			},
			{
				...equityContract,
				functionName: "totalVotes",
			},
		],
	});

	const totalSupply: bigint = data ? decodeBigIntCall(data[0]) : 0n;
	const totalVotes: bigint = data ? decodeBigIntCall(data[1]) : 0n;

	const avgHoldingDuration: bigint = totalSupply > 0n ? (totalVotes / totalSupply) >> 20n : 0n;
	const fpsForVeto: bigint = (totalSupply * 200n) / 10000n;

	return {
		avgHoldingDuration,
		fpsForVeto,
	};
};
