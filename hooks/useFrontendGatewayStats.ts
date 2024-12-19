import { useAccount, useChainId, useReadContracts } from "wagmi";
import { decodeBigIntCall } from "@utils";
import { zeroAddress } from "viem";
import { ADDRESS, DecentralizedEUROABI } from "@deuro/eurocoin";

export const useFrontendGatewayStats = () => {
	const chainId = useChainId();
	const { address } = useAccount();
	const account = address || zeroAddress;

	const dEuroContract = {
		address: ADDRESS[chainId].decentralizedEURO,
		abi: DecentralizedEUROABI,
	};

	const { data } = useReadContracts({
		contracts: [
			{
				...dEuroContract,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].frontendGateway],
			},
		],
	});

	const frontendGatewayAllowance: bigint = data ? decodeBigIntCall(data[0]) : 0n;

	return { frontendGatewayAllowance };
};
