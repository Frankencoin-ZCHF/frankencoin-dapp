import { formatCurrency } from "../../utils/format";
import Button from "@components/Button";
import NormalInput from "@components/Input/NormalInput";
import AppCard from "@components/AppCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, EquityABI, SavingsABI } from "@frankencoin/zchf";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import { LeadrateRateQuery } from "@frankencoin/api";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { Address } from "viem";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MintModule = ADDRESS[mainnet.id].savingsV2.toLowerCase() as Address;
const SaveModule = ADDRESS[mainnet.id].savingsReferral.toLowerCase() as Address;

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const account = useAccount();
	const chainId = mainnet.id;
	const rate = useSelector((state: RootState) => state.savings.leadrateRate.rate[chainId]);
	const rates = useSelector((state: RootState) => state.savings.leadrateRate.list[chainId]);

	const [newRateMint, setNewRateMint] = useState<bigint>(BigInt(rate[MintModule].approvedRate));
	const [isHandlingMint, setHandlingMint] = useState<boolean>(false);
	const [isHiddenMint, setHiddenMint] = useState<boolean>(false);
	const [isDisabledMint, setDisabledMint] = useState<boolean>(true);

	const [newRateSave, setNewRateSave] = useState<bigint>(BigInt(rate[SaveModule].approvedRate));
	const [isHandlingSave, setHandlingSave] = useState<boolean>(false);
	const [isHiddenSave, setHiddenSave] = useState<boolean>(false);
	const [isDisabledSave, setDisabledSave] = useState<boolean>(true);

	useEffect(() => {
		if (newRateMint != BigInt(rate[MintModule].approvedRate)) setDisabledMint(false);
		else setDisabledMint(true);
	}, [newRateMint, rate]);

	useEffect(() => {
		if (newRateSave != BigInt(rate[SaveModule].approvedRate)) setDisabledSave(false);
		else setDisabledSave(true);
	}, [newRateSave, rate]);

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

	const handleOnClickMint = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandlingMint(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: MintModule,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [parseInt(String(newRateMint)), []],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(rate[MintModule].approvedRate / 10000)}%`,
				},
				{
					title: `Proposing to: `,
					value: `${formatCurrency(parseInt(String(newRateMint)) / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Proposing mint rate change...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully proposed" rows={toastContent} />,
				},
			});

			setHiddenMint(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setHandlingMint(false);
		}
	};

	const handleOnClickSave = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandlingSave(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: SaveModule,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [parseInt(String(newRateSave)), []],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(rate[SaveModule].approvedRate / 10000)}%`,
				},
				{
					title: `Proposing to: `,
					value: `${formatCurrency(parseInt(String(newRateSave)) / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Proposing save rate change...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully proposed" rows={toastContent} />,
				},
			});

			setHiddenSave(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setHandlingSave(false);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Historical Rates</div>

				<div className="-m-4 pr-2">
					<ApexChart
						type="line"
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#092f62", "#0F80F0"],
							stroke: {
								curve: "linestep",
								width: 3,
							},
							chart: {
								type: "line",
								height: 100,
								dropShadow: {
									enabled: false,
								},
								toolbar: {
									show: false,
								},
								zoom: {
									enabled: false,
								},
								background: "0",
							},
							dataLabels: {
								enabled: false,
							},
							grid: {
								show: false,
							},
							xaxis: {
								type: "datetime",
								labels: {
									show: true,
									formatter: (value) => {
										const date = new Date(value);
										const d = date.getDate();
										const m = date.getMonth() + 1;
										const y = date.getFullYear();
										return `${d}.${m}.${y}`;
									},
								},
								axisBorder: {
									show: false,
								},
								axisTicks: {
									show: false,
								},
							},
							yaxis: {
								labels: {
									show: true,
									formatter: (value) => {
										return `${Math.round(value / 1000) / 10} %`;
									},
								},
								axisBorder: {
									show: true,
								},
								axisTicks: {
									show: true,
								},
								min: 0,
								max: (max) => {
									return max + max * 0.1;
								},
							},
						}}
						series={[
							{
								name: "Mint",
								data: matchingRatesMint.map((entry) => {
									return [entry.created * 1000, Math.round(entry.approvedRate)];
								}),
							},
							{
								name: "Save",
								data: matchingRatesSave.map((entry) => {
									return [entry.created * 1000, Math.round(entry.approvedRate)];
								}),
							},
						]}
					/>

					{matchingRatesMint.length == 0 || matchingRatesSave.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>

			<AppCard>
				<div className="flex flex-col gap-4">
					<div className="mt-4 text-lg font-bold text-center">Propose a new Rate</div>

					<NormalInput
						symbol="%"
						label="Mint Rate"
						placeholder={`Change Rate`}
						value={newRateMint.toString()}
						digit={4}
						onChange={(e) => setNewRateMint(BigInt(e))}
					/>

					<div className="h-10 -mt-4 mb-4">
						<GuardSupportedChain disabled={isDisabledMint || isHiddenMint} chain={mainnet}>
							<Button
								disabled={isDisabledMint || isHiddenMint}
								isLoading={isHandlingMint}
								onClick={(e) => handleOnClickMint(e)}
							>
								Propose Change
							</Button>
						</GuardSupportedChain>
					</div>

					<NormalInput
						symbol="%"
						label="Save Rate"
						placeholder={`Change Rate`}
						value={newRateSave.toString()}
						digit={4}
						onChange={(e) => setNewRateSave(BigInt(e))}
					/>

					<div className="h-10 -mt-4 mb-4">
						<GuardSupportedChain disabled={isDisabledSave || isHiddenSave} chain={mainnet}>
							<Button
								disabled={isDisabledSave || isHiddenSave}
								isLoading={isHandlingSave}
								onClick={(e) => handleOnClickSave(e)}
							>
								Propose Change
							</Button>
						</GuardSupportedChain>
					</div>
				</div>
			</AppCard>
		</div>
	);
}
