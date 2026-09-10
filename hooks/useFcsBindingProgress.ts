import { useReadContracts } from "wagmi";
import { mainnet } from "viem/chains";
import { ADDRESS, EquityABI, FCSABI } from "@frankencoin/zchf";
import { formatUnits } from "viem";
import { decodeBigIntCall } from "../utils/format";

export type FcsBindingProgress = {
	pct: number; // FCS's share of all FPS votes, 0-100
	wfpsPct: number; // WFPS's share of all FPS votes, 0-100
	isBinding: boolean; // exact on-chain source of truth (>2/3), not a client-side re-derivation
};

// Equity.relativeVotes(FCS) is the same value FCS.isBinding() is itself computed from
// (relativeVotes(FCS) * 3 > 2e18), so this is the authoritative live share of all FPS votes FCS
// currently controls. relativeVotes(WFPS) is the same getter applied to the older, simple wrapper.
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
				functionName: "relativeVotes",
				args: [ADDRESS[mainnet.id].wFPS],
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
	const wfpsRelativeVotes = data ? decodeBigIntCall(data[1]) : 0n;
	const isBinding = data?.[2]?.result === true;
	const pct = parseFloat(formatUnits(fcsRelativeVotes, 18)) * 100;
	const wfpsPct = parseFloat(formatUnits(wfpsRelativeVotes, 18)) * 100;

	return { pct, wfpsPct, isBinding };
};
