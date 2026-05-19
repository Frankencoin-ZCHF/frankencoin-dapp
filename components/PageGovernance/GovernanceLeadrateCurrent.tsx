import AppCard from "@components/AppCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import dynamic from "next/dynamic";
import { LeadrateRateQuery } from "@frankencoin/api";
import { mainnet } from "viem/chains";
import { normalizeAddress } from "../../utils/format";
import GovernanceLeadrateActionMint from "./GovernanceLeadrateActionMint";
import GovernanceLeadrateActionSave from "./GovernanceLeadrateActionSave";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MintModule = normalizeAddress(ADDRESS[mainnet.id].savingsV2);
const SaveModule = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);

export default function GovernanceLeadrateCurrent() {
	const chainId = mainnet.id;
	const rate = useSelector((state: RootState) => state.savings.leadrateRate.rate[chainId]);
	const rates = useSelector((state: RootState) => state.savings.leadrateRate.list[chainId]);

	const latestDefaultEntryMint: LeadrateRateQuery = {
		chainId: mainnet.id,
		created: Math.floor(Date.now() / 1000),
		count: 9999999999,
		blockheight: 9999999999,
		module: MintModule,
		approvedRate: rate[MintModule].approvedRate,
		txHash: "0xlatestDefaultEntryMintHash",
	};

	const latestDefaultEntrySave: LeadrateRateQuery = {
		chainId: mainnet.id,
		created: Math.floor(Date.now() / 1000),
		count: 9999999999,
		blockheight: 9999999999,
		module: SaveModule,
		approvedRate: rate[SaveModule].approvedRate,
		txHash: "0xlatestDefaultEntrySaveHash",
	};

	const matchingRatesMint = [latestDefaultEntryMint, ...rates[MintModule]];
	const matchingRatesSave = [latestDefaultEntrySave, ...rates[SaveModule]];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Historical Rates</div>

				<div className="-m-4 pr-2">
					<ApexChart
						type="line"
						options={{
							theme: { monochrome: { enabled: false } },
							colors: ["#092f62", "#0F80F0"],
							stroke: { curve: "linestep", width: 3 },
							chart: {
								type: "line",
								height: 100,
								dropShadow: { enabled: false },
								toolbar: { show: false },
								zoom: { enabled: false },
								background: "0",
							},
							dataLabels: { enabled: false },
							grid: { show: false },
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									formatter: (value) => {
										const d = new Date(value);
										return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
									},
								},
								axisBorder: { show: false },
								axisTicks: { show: false },
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => `${Math.round(value / 1000) / 10} %`,
								},
								axisBorder: { show: true },
								axisTicks: { show: true },
								min: 0,
								max: (max) => (Math.floor(max / 100000) + 1) * 50000,
							},
						}}
						series={[
							{
								name: "Mint",
								data: matchingRatesMint.map((e) => [e.created * 1000, Math.round(e.approvedRate)]),
							},
							{
								name: "Save",
								data: matchingRatesSave.map((e) => [e.created * 1000, Math.round(e.approvedRate)]),
							},
						]}
					/>

					{matchingRatesMint.length === 0 || matchingRatesSave.length === 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="flex flex-col gap-4">
					<div className="mt-4 text-lg font-bold text-center">Propose a new Rate</div>
					<GovernanceLeadrateActionMint />
					<GovernanceLeadrateActionSave />
				</div>
			</AppCard>
		</div>
	);
}
