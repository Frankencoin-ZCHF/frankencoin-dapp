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
import { CONFIG, WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, SavingsABI } from "@frankencoin/zchf";
import { TxToast } from "@components/TxToast";
import { toast } from "react-toastify";

interface Props {}

export default function GovernanceLeadrateCurrent({}: Props) {
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG.chain.id;
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
		const n = parseFloat(value);
		if (typeof n != "number") return;
		setNewRate(n);
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
			toast.error(<TxToast title="Something did not work..." rows={[{ title: "Did you reject the Transaction?" }]} />, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
		} finally {
			setHandling(false);
		}
	};

	return (
		<AppCard>
			<div className="grid items-center md:gap-16 md:grid-cols-3 md:pl-16 md:pr-8 max-md:mt-4 max-md:gap-4 max-md:grid-cols-1 max-md:px-4">
				<AppBox>
					<div className="flex flex-row py-1">
						<div className="flex-1 text-left">Current Rate</div>
						<div className="text-right">{formatCurrency(info.rate / 10_000)}%</div>
					</div>
				</AppBox>

				<NormalInput
					symbol="%"
					label=""
					placeholder="New rate"
					value={newRate?.toString() ?? ""}
					digit={4}
					onChange={(v) => changeNewRate(v)}
				/>

				<div className="flex justify-end">
					<div className="my-2 md:w-[8rem] max-md:w-full">
						<GuardToAllowedChainBtn label="Propose" disabled={isDisabled || isHidden}>
							<Button
								className="h-10"
								disabled={isDisabled || isHidden}
								isLoading={isHandling}
								onClick={(e) => handleOnClick(e)}
							>
								Propose
							</Button>
						</GuardToAllowedChainBtn>
					</div>
				</div>
			</div>
		</AppCard>
	);
}
