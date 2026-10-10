import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { ADDRESS, SavingsABI, SavingsV2ABI } from "@frankencoin/zchf";
import { track } from "@hooks";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { Address, isAddress } from "viem";

interface Props {
	owner: Address;
	disabled?: boolean;
	setLoaded?: (val: boolean) => Dispatch<SetStateAction<boolean>>;
}

export default function SavingsActionRedeem({ owner, disabled, setLoaded }: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(true);
	const { address } = useConnection();
	const chainId = mainnet.id;

	useEffect(() => {
		if (!isAddress(owner)) return;

		const fetcher = async () => {
			const [saved, ticks] = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsV2,
				chainId: chainId,
				abi: SavingsV2ABI,
				functionName: "savings",
				args: [owner],
			});

			setHidden(saved == 0n);
		};

		fetcher();
	}, [owner, chainId]);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address || address.toLowerCase() != owner.toLowerCase()) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				account: owner,
				address: ADDRESS[chainId].savingsV2,
				chainId: chainId,
				abi: SavingsABI,
				functionName: "adjust",
				args: [0n],
			});

			const toastContent = [
				{
					title: `Saved amount: `,
					value: `0 ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Redeeming from savings...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully redeemed" rows={toastContent} />,
				},
			});

			track("savings_redeemed_v1");
			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	return isHidden || !address || address.toLowerCase() != owner.toLowerCase() ? null : (
		<div className="flex flex-col mx-auto max-w-full gap-4 items-center justify-center">
			<div className="flex-1 text-text-secondary">
				You have unclaimed savings in an older Savings Module. Click here to claim your savings.
			</div>
			<div className="w-full">
				<GuardSupportedChain chain={mainnet}>
					<AppButton className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
						Redeem from older Version
					</AppButton>
				</GuardSupportedChain>
			</div>
		</div>
	);
}
