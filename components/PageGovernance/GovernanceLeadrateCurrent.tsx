import { formatCurrency } from "../../utils/format";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
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
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { LeadrateRateQuery } from "@frankencoin/api";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = mainnet.id;
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
				address: ADDRESS[chainId].savingsReferral,
				chainId: chainId,
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
				<div className="mt-4 text-lg font-bold text-center">Applicable Rates</div>

				<div className="-m-4 mr-4">
					<ApexChart
						type="line"
						options={{
							theme: {
								monochrome: {
									enabled: false,
								},
							},
							colors: ["#092f62"],
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
								min: (min) => {
									return min - min * 0.1;
								},
								max: (max) => {
									return max + max * 0.1;
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

					<GuardSupportedChain disabled={isDisabled || isHidden} chain={mainnet}>
						<Button
							className="max-md:h-10 md:h-12"
							disabled={isDisabled || isHidden}
							isLoading={isHandling}
							onClick={(e) => handleOnClick(e)}
						>
							Propose Change
						</Button>
					</GuardSupportedChain>
				</div>
			</AppCard>
		</div>
	);
}
