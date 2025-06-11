import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits, maxUint256 } from "viem";
import { ADDRESS, FrankencoinABI, ReferenceTransferABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	chain: string;
	recipient: Address;
	reference: string;
	amount: bigint;
	disabled?: boolean;
	setLoaded?: Dispatch<SetStateAction<boolean>>;
}

export default function TransferActionCreate({ chain, recipient, reference, amount, disabled, setLoaded }: Props) {
	const [isApproving, setApproving] = useState<boolean>(false);
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const [allowance, setAllowance] = useState(0n);
	const { address } = useAccount();
	const chainId = useChainId();
	const { data } = useBlockNumber();

	const handleApprove = async (e: any) => {
		e.preventDefault();
		if (!address) return;

		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: FrankencoinABI,
				functionName: "approve",
				args: [ADDRESS[chainId].referenceTransfer, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite ZCHF",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].referenceTransfer),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ZCHF`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].referenceTransfer,
				abi: ReferenceTransferABI,
				functionName: "transfer",
				args: [recipient, amount, reference],
			});

			const toastContent = [
				{
					title: `Recipient: `,
					value: shortenAddress(recipient),
				},
				{
					title: `Reference: `,
					value: reference,
				},
				{
					title: `Transfer: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ZCHF`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Transfer pending...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Transfer successful" rows={toastContent} />,
				},
			});

			if (setLoaded != undefined) setLoaded(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setAction(false);
		}
	};

	useEffect(() => {
		if (address == undefined || data == undefined) return;

		const fetcher = async () => {
			const allow = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankenCoin,
				abi: FrankencoinABI,
				functionName: "allowance",
				args: [address, ADDRESS[chainId].referenceTransfer],
			});

			setAllowance(allow);
		};

		fetcher();
	}, [address, chainId, data]);

	return (
		<GuardSupportedChain chain={WAGMI_CHAINS.find((c) => c.name.toLowerCase() == chain.toLowerCase())}>
			{allowance < amount ? (
				<Button className="h-10" disabled={isHidden || disabled} isLoading={isApproving} onClick={(e) => handleApprove(e)}>
					Approve
				</Button>
			) : (
				<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
					Transfer
				</Button>
			)}
		</GuardSupportedChain>
	);
}
