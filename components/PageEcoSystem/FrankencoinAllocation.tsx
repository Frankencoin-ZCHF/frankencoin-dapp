import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppCard from "../AppCard";
import { formatUnits } from "viem";
import dynamic from "next/dynamic";
import { formatCurrency } from "../../utils/format";
import { colors } from "../../utils/constant";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, FrankencoinABI, StablecoinBridgeABI } from "@frankencoin/zchf";
import { base, gnosis, mainnet } from "viem/chains";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function FrankencoinAllocation() {
	const { openPositions } = useSelector((state: RootState) => state.positions);
	const { fpsInfo } = useSelector((state: RootState) => state.ecosystem);
	const { savingsInfo } = useSelector((state: RootState) => state.savings);

	const [swapBridgeVCHF, setSwapBridgeVCHF] = useState(0n);

	const [protocols, setProtocols] = useState(0);
	const [dex, setDex] = useState(0);
	const [cex, setCex] = useState(0);

	// Aggregate collateral
	const byCollateral = new Map<string, bigint>();
	(openPositions ?? []).forEach((p) => {
		const key = String(p.collateralSymbol);
		byCollateral.set(key, (byCollateral.get(key) ?? 0n) + BigInt(p.minted));
	});

	// Aggregate swap bridges
	byCollateral.set("VCHF", swapBridgeVCHF);

	const mappingMinted = [...byCollateral.keys()]
		.map((label, idx) => {
			return {
				label,
				value: byCollateral.get(label) ?? 0n,
			};
		})
		.sort((a, b) => (b.value > a.value ? 1 : -1));

	const totalMinted = parseFloat(
		formatUnits(
			mappingMinted.map((m) => m.value).reduce((a, b) => a + b, 0n),
			18
		)
	);
	const freeFlow = totalMinted - fpsInfo.reserve.equity - fpsInfo.reserve.minter - savingsInfo.totalBalance - protocols - dex - cex;

	const mapping = [
		{
			label: "Equity Reserve",
			value: fpsInfo.reserve.equity,
		},
		{
			label: "Minter Reserve",
			value: fpsInfo.reserve.minter,
		},
		{
			label: "Savings Modules",
			value: savingsInfo.totalBalance,
		},
		{
			label: "External Protocols",
			value: protocols,
		},
		{
			label: "Decentralized Exchanges",
			value: dex,
		},
		{
			label: "Centralized Exchanges",
			value: cex,
		},
		{
			label: "Circulating Supply",
			value: freeFlow,
		},
	].sort((a, b) => (a.value > b.value ? -1 : 1));

	const labels = mapping.map((m) => m.label);
	const series = mapping.map((m) => Math.round(m.value));
	const total = series.reduce((a, b) => a + b, 0);

	const percentByLabel = new Map<string, number>();
	labels.forEach((label, idx) => {
		const v = series[idx];
		const pct = total === 0 ? 0 : Math.round(Number((v * 1000) / total)) / 10;
		percentByLabel.set(label, pct);
	});

	useEffect(() => {
		const fetcher = async () => {
			const bridges: Promise<any>[] = [];
			const dexes: Promise<any>[] = [];
			const cexes: Promise<any>[] = [];
			const protocols: Promise<any>[] = [];

			// SwapBrideVCHF
			bridges.push(
				readContract(WAGMI_CONFIG, {
					chainId: mainnet.id,
					address: ADDRESS[mainnet.id].stablecoinBridgeVCHF,
					abi: StablecoinBridgeABI,
					functionName: "minted",
				})
			);

			// UniSwap USDT
			// https://etherscan.io/address/0x8E4318E2cb1ae291254B187001a59a1f8ac78cEF
			dexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: mainnet.id,
					address: ADDRESS[mainnet.id].frankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0x8E4318E2cb1ae291254B187001a59a1f8ac78cEF"],
				})
			);

			// UniSwap WETH
			// https://app.uniswap.org/explore/pools/ethereum/0x79DC831D556954FBC37615A711df16B0b61Df083
			dexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: mainnet.id,
					address: ADDRESS[mainnet.id].frankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0x79DC831D556954FBC37615A711df16B0b61Df083"],
				})
			);

			// Base
			// https://basescan.org/address/0xc77c42baa1bdf2708c5ef8cfca3533b3e09b058f
			dexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: base.id,
					address: ADDRESS[base.id].ccipBridgedFrankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0xc77c42baa1bdf2708c5ef8cfca3533b3e09b058f"],
				})
			);

			// Base
			// https://basescan.org/address/0x80891885537e20e240987385490017fc03d9d7ed
			dexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: base.id,
					address: ADDRESS[base.id].ccipBridgedFrankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0x80891885537e20e240987385490017fc03d9d7ed"],
				})
			);

			// Gnosis EURe
			// https://gnosisscan.io/address/0x1bb53efa5523c80b598b561e266dfdc938f80e4f
			dexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: gnosis.id,
					address: ADDRESS[gnosis.id].ccipBridgedFrankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0x1bb53efa5523c80b598b561e266dfdc938f80e4f"],
				})
			);

			// MEXC
			// https://etherscan.io/address/0x9642b23ed1e01df1092b92641051881a322f5d4e
			cexes.push(
				readContract(WAGMI_CONFIG, {
					chainId: mainnet.id,
					address: ADDRESS[mainnet.id].frankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0x9642b23Ed1E01Df1092B92641051881a322F5D4E"],
				})
			);

			// Morpho
			// https://etherscan.io/address/0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb
			protocols.push(
				readContract(WAGMI_CONFIG, {
					chainId: mainnet.id,
					address: ADDRESS[mainnet.id].frankencoin,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: ["0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"],
				})
			);

			// helper results
			const getResults = async (items: Promise<any>[]) => {
				return (await Promise.allSettled(items)).map((i) => {
					if (i.status == "fulfilled") return i.value as bigint;
					return 0n;
				});
			};

			// set results
			const resultBridges = await getResults(bridges);
			setSwapBridgeVCHF(resultBridges[0]);

			const resultDexes = await getResults(dexes);
			setDex(resultDexes.reduce((a, b) => a + parseInt(formatUnits(b, 18)), 0));

			const resultCexes = await getResults(cexes);
			setCex(resultCexes.reduce((a, b) => a + parseInt(formatUnits(b, 18)), 0));

			const resultProtocols = await getResults(protocols);
			setProtocols(resultProtocols.reduce((a, b) => a + parseInt(formatUnits(b, 18)), 0));
		};
		fetcher();
	}, []);

	return (
		<AppCard>
			<div className="mt-4 text-lg font-bold text-center">Frankencoins by Holder Type</div>

			<div className="grid md:grid-cols-2 gap-4">
				<div className="pr-2">
					<ApexChart
						height={"350px"}
						type="donut"
						options={{
							chart: { type: "donut", background: "0" },
							colors,
							theme: { palette: "palette2" },
							labels,
							dataLabels: {
								enabled: true,
								formatter: (val: number) => `${Math.round(Number(val))}%`,
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value / 100000) / 10} Mio. ZCHF`;
									},
								},
							},
							legend: {
								show: false,
							},
							plotOptions: {
								pie: {
									donut: {
										labels: {
											show: true,
											total: {
												show: true,
												label: "Total",
												formatter: () => `${labels.length} holders`,
											},
										},
									},
								},
							},
						}}
						series={series}
					/>

					{labels.length == 0 ? <div className="flex justify-center text-text-warning">No data available.</div> : null}
				</div>

				<div className="mt-8 space-y-1">
					{labels.map((label, idx) => (
						<div key={`${label}_${idx}`} className="flex justify-between">
							<div className="text-text-secondary font-semibold" style={{ color: colors[idx % colors.length] }}>
								{label} <span className="text-sm">({percentByLabel.get(label)}%)</span>
							</div>
							<div className="text-text-secondary font-semibold">{formatCurrency(series[idx].toString(), 2)} ZCHF</div>
						</div>
					))}
					<div className="flex justify-between">
						<div className="text-text-primary font-semibold mt-2">
							Total <span className="text-sm">(100%)</span>
						</div>
						<div className="text-text-primary font-semibold mt-2">{formatCurrency(total, 2)} ZCHF</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
