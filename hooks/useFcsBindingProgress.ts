import { useReadContracts } from "wagmi";
import { mainnet } from "viem/chains";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { formatUnits } from "viem";
import { decodeBigIntCall } from "../utils/format";

export type FcsBindingProgress = {
	pct: number; // FCS's share of all FPS votes, 0-100
	fpsSupply: bigint; // total FPS supply
	fcsFpsBalance: bigint; // FPS held by the FCS contract, i.e. the FPS backing all FCS
	isBinding: boolean; // exact on-chain source of truth (>2/3), not a client-side re-derivation
};

// Equity.relativeVotes(FCS) is the same value FCS.isBinding() is itself computed from
// (relativeVotes(FCS) * 3 > 2e18), so this is the authoritative live share of all FPS votes FCS
// currently controls.
export const useFcsBindingProgress = (): FcsBindingProgress => {
	const { data } = useReadContracts({
		contracts: [
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "relativeVotes",
				args: [ADDRESS[mainnet.id].fcs],
			},
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "totalSupply",
			},
			{
				address: ADDRESS[mainnet.id].equity,
				chainId: mainnet.id,
				abi: EquityABI,
				functionName: "balanceOf",
				args: [ADDRESS[mainnet.id].fcs],
			},
			{
				address: ADDRESS[mainnet.id].fcs,
				chainId: mainnet.id,
				abi: FCSABI,
				functionName: "isBinding",
			},
		],
	});

	const fcsRelativeVotes = data ? decodeBigIntCall(data[0]) : 0n;
	const fpsSupply = data ? decodeBigIntCall(data[1]) : 0n;
	const fcsFpsBalance = data ? decodeBigIntCall(data[2]) : 0n;
	const isBinding = data?.[3]?.result === true;
	const pct = parseFloat(formatUnits(fcsRelativeVotes, 18)) * 100;

	return { pct, fpsSupply, fcsFpsBalance, isBinding };
};
