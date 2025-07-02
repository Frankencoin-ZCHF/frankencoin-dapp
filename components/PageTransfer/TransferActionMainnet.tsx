import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits, Hash, maxUint256 } from "viem";
import { ADDRESS, ChainIdSide, FrankencoinABI, TransferReferenceABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";
import { useUserAllowance } from "../../hooks/useUserAllowance";
import { AppKitNetwork } from "@reown/appkit/networks";

interface Props {
	recipient: Address;
	recipientChain: AppKitNetwork;
	ccipFee: bigint;
	addReference?: boolean;
	reference: string;
	amount: bigint;
	disabled?: boolean;
	setLoaded?: Dispatch<SetStateAction<boolean>>;
}

export default function TransferActionMainnet({
	recipientChain,
	recipient,
	ccipFee,
	reference,
	addReference = false,
	amount,
	disabled,
	setLoaded,
}: Props) {
	const [isApproving, setApproving] = useState<boolean>(false);
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const { address } = useAccount();

	const userAllowance = useUserAllowance([{ spender: ADDRESS[mainnet.id].transferReference, chainId: mainnet.id }]);
	const allowance = userAllowance[0].allowance;

	const isSameChain = recipientChain.name.toLowerCase() == mainnet.name.toLowerCase();

	const handleApprove = async (e: any) => {
		e.preventDefault();
		if (!address) return;

		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].frankencoin,
				chainId: mainnet.id,
				abi: FrankencoinABI,
				functionName: "approve",
				args: [ADDRESS[mainnet.id].transferReference, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite ZCHF",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[mainnet.id].transferReference),
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

			let writeHash: Hash;

			if (isSameChain && addReference) {
				// transfer with reference
				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].transferReference,
					chainId: mainnet.id,
					abi: TransferReferenceABI,
					functionName: "transfer",
					args: [recipient, amount, reference],
				});
			} else if (isSameChain && !addReference) {
				// normal frankencoin transfer
				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].frankencoin,
					chainId: mainnet.id,
					abi: FrankencoinABI,
					functionName: "transfer",
					args: [recipient, amount],
				});
			} else {
				// from mainnet to sidechain with reference
				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[mainnet.id].transferReference,
					chainId: mainnet.id,
					abi: TransferReferenceABI,
					functionName: "crossTransfer",
					args: [
						BigInt(ADDRESS[recipientChain.id as ChainIdSide].chainSelector),
						recipient,
						amount,
						addReference ? reference : "",
					],
					value: (ccipFee * 12n) / 10n, // @dev add 20% more. Low level call will return unused amount.
				});
			}

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

	return (
		<GuardSupportedChain chain={mainnet}>
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
