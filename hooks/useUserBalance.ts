import { useAccount, useChainId, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { ADDRESS, EquityABI, DecentralizedEUROABI } from "@deuro/eurocoin";

export const useUserBalance = () => {
	const chainId = useChainId();
	const { address } = useAccount();

	const deuroContract = {
		address: ADDRESS[chainId].decentralizedEURO,
		abi: DecentralizedEUROABI,
	} as const;

	const equityContract = {
		address: ADDRESS[chainId].equity,
		abi: EquityABI,
	};

	const account = address || "0x0";

	// Fetch all blockchain stats in one web3 call using multicall
	const { data } = useReadContracts({
		contracts: [
			{
				...deuroContract,
				functionName: "balanceOf",
				args: [account],
			},
			{
				...equityContract,
				functionName: "balanceOf",
				args: [account],
			},
		],
	});

	const deuroBalance: bigint = data ? decodeBigIntCall(data[0]) : BigInt(0);
	const equityBalance: bigint = data ? decodeBigIntCall(data[1]) : BigInt(0);

	return {
		deuroBalance,
		equityBalance,
	};
};
