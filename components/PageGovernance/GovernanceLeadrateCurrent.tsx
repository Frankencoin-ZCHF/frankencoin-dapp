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

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG_CHAIN().id;
	const info = useSelector((state: RootState) => state.savings.leadrateInfo);
	const [newRate, setNewRate] = useState<number>(info.rate || 0);
	const [isHidden, setHidden] = useState<boolean>(false);
	const [isDisabled, setDisabled] = useState<boolean>(true);

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
				address: ADDRESS[chainId].savings,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [newRate, []],
			});

			const toastContent = [
				{
					title: `From: `,
					value: `${formatCurrency(info.rate / 10000)}%`,
				},
				{
					title: `Proposing to: `,
					value: `${formatCurrency(newRate / 10000)}%`,
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
			toast.error(renderErrorTxToast(error));
		} finally {
			setHandling(false);
		}
	};

	return (
		<AppCard>
			<div className="grid gap-8 md:grid-cols-2 md:px-12 md:py-4 max-md:grid-cols-1 max-md:p-4">
				<div className="flex flex-col gap-4">
					<NormalInput
						symbol="%"
						label="Current value"
						placeholder={`Current Leadrate: %`}
						value={newRate.toString()}
						digit={4}
						onChange={(v) => changeNewRate(v)}
					/>
				</div>

				<div className="md:mt-8 md:px-16">
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
			</div>
		</AppCard>
	);
}
