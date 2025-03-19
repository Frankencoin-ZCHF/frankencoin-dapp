import { formatCurrency } from "../../utils/format";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import Button from "@components/Button";
import NormalInput from "@components/Input/NormalInput";
import AppCard from "@components/AppCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { CONFIG, WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, EquityABI, SavingsABI } from "@frankencoin/zchf";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { LeadrateRateQuery } from "@frankencoin/api";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG.chain.id;
	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const rates = useSelector((state: RootState) => state.savings.leadrateRate.list);
	const [newRate, setNewRate] = useState<bigint>(BigInt(info.rate));
	const [isHidden, setHidden] = useState<boolean>(false);
	const [isDisabled, setDisabled] = useState<boolean>(true);

	useEffect(() => {
		if ((String(newRate) != "" && newRate != BigInt(info.rate)) || info.isProposal) setDisabled(false);
		else setDisabled(true);
	}, [newRate, info]);

	if (!info) return null;

	const latestDefaultEntry: LeadrateRateQuery = {
		approvedRate: info.rate,
		blockheight: 0,
		created: Date.now() / 1000,
		id: "latestDefaultEntry_id",
		txHash: "latestDefaultEntry_hash",
	};

	const matchingRates = [latestDefaultEntry, ...rates];

	const changeNewRate = (value: string) => {
		const valueValue = BigInt(value);
		setNewRate(valueValue);
	};

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandling(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [parseInt(String(newRate)), []],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(info.rate / 10000)}%`,
				},
				{
					title: `Proposing to: `,
					value: `${formatCurrency(parseInt(String(newRate)) / 10000)}%`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Proposing rate change...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully proposed" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setHandling(false);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="flex flex-col gap-4">
					<div className="mt-4 text-lg font-bold text-center">Propose a new Rate</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<AppBox>
							<DisplayLabel label="Current Base Rate" />
							<DisplayOutputAlignedRight className="" amount={info.rate / 10_000} unit="%" />
						</AppBox>
						<AppBox>
							<DisplayLabel label="Current Proposed Rate" />
							{info.isProposal ? (
								<DisplayOutputAlignedRight className="" amount={info.nextRate / 10_000} unit="%" />
							) : (
								<DisplayOutputAlignedRight className="" output={"-"} unit="%" />
							)}
						</AppBox>
					</div>

					<NormalInput
						symbol="%"
						label="Change Base Rate"
						placeholder={`Disable Rate`}
						value={newRate.toString()}
						digit={4}
						onChange={changeNewRate}
					/>

					<GuardToAllowedChainBtn label="Propose" disabled={isDisabled || isHidden}>
						<Button
							className="max-md:h-10 md:h-12"
							disabled={isDisabled || isHidden}
							isLoading={isHandling}
							onClick={(e) => handleOnClick(e)}
						>
							Propose Change
						</Button>
					</GuardToAllowedChainBtn>
				</div>
			</AppCard>

			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Applied Rates</div>

				<div className="-m-4 mr-4">
					<ApexChart
						type="area"
						options={{
							theme: {
								monochrome: {
									color: "#092f62",
									enabled: true,
								},
							},
							chart: {
								type: "area",
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
							stroke: {
								width: 3,
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
									show: false,
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
							},
							fill: {
								type: "gradient",
								gradient: {
									shadeIntensity: 0,
									opacityTo: 0.2,
									shade: "#e7e7ea",
									gradientToColors: ["#092f62"],
								},
							},
						}}
						series={[
							{
								name: "Rates",
								data: matchingRates.map((entry) => {
									return [entry.created * 1000, Math.round(entry.approvedRate)];
								}),
							},
						]}
					/>

					{matchingRates.length == 0 ? (
						<div className="flex justify-center text-text-warning">No data available for selected timeframe.</div>
					) : null}
				</div>
			</AppCard>
		</div>
	);
}
