import { Address, formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { formatCurrency, shortenAddress } from "../../utils/format";
import { useDelegationQuery } from "@hooks";
import { AddressLabelSimple } from "@components/AddressLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import Button from "@components/Button";
import NormalInput from "@components/Input/NormalInput";
import AppCard from "@components/AppCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import AppBox from "@components/AppBox";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { CONFIG_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, SavingsABI } from "@deuro/eurocoin";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { BigNumberInput } from "@components/Input/BigNumberInput";

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG_CHAIN().id;
	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const [newRate, setNewRate] = useState<number>(info.rate || 0);
	const [isHidden, setHidden] = useState<boolean>(false);
	const [isDisabled, setDisabled] = useState<boolean>(true);
	const { t } = useTranslation();

	useEffect(() => {
		if (newRate != info.rate) setDisabled(false);
		else setDisabled(true);
	}, [newRate, info.rate]);

	if (!info) return null;

	const changeNewRate = (value: string) => {
		if (!value || value?.length == 0) return;
		const n = parseFloat(value);
		if (typeof n != "number") setNewRate(0);
		else setNewRate(n);
	};

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandling(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsGateway,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [newRate, []],
			});

			const toastContent = [
				{
					title: t("governance.txs.from"),
					value: `${formatCurrency(info.rate / 10000)}%`,
				},
				{
					title: t("governance.txs.proposing_to"),
					value: `${formatCurrency(newRate / 10000)}%`,
				},
				{
					title: t("governance.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("governance.txs.proposing_rate_change")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("governance.txs.successfully_proposed")} rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error toast
		} finally {
			setHandling(false);
		}
	};

	return (
		<AppCard className="p-0">
			<div className="grid p-4 md:pl-8 md:pr-12 md:py-4 sm:grid-cols-2 sm:auto-rows-auto gap-2 sm:gap-y-3 sm:gap-x-6">
				<span className="text-base font-[350] leading-tight text-text-muted2">{t("governance.current_value")}</span>
				<div></div>
				<div className="p-2 pr-4 flex items-center gap-3 bg-layout-primary rounded-xl">
					<div className="flex flex-1 p-2.5 border border-input-border rounded-lg bg-white">
						<BigNumberInput
							placeholder={`${t("governance.current_leadrate")}: %`}
							value={newRate.toString()}
							decimals={4}
							onChange={(v) => changeNewRate(v)}
							className="flex flex-1 text-right p-0 text-lg leading-[1.4375rem]"
						/>
					</div>
					<div className="px-5 flex items-center justify-center">
						<span className="text-text-disabled font-medium text-lg leading-[1.4375rem]">%</span>
					</div>
				</div>

				<GuardToAllowedChainBtn
					buttonClassName="h-full w-full sm:max-w-48 p-4"
					label={t("dashboard.propose")}
					disabled={isDisabled || isHidden}
				>
					<Button
						className="h-full full sm:max-w-48 p-4"
						disabled={isDisabled || isHidden}
						isLoading={isHandling}
						onClick={(e) => handleOnClick(e)}
					>
						{t("dashboard.propose")}
					</Button>
				</GuardToAllowedChainBtn>
			</div>
		</AppCard>
	);
}
