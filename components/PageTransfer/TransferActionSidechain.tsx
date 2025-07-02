import { Dispatch, SetStateAction, useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount, useChainId } from "wagmi";
import Button from "@components/Button";
import { Address, formatUnits, Hash, parseEther } from "viem";
import { ADDRESS, BridgedFrankencoinABI, ChainIdSide } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
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

export default function TransferActionSidechain({
	recipientChain,
	recipient,
	ccipFee,
	reference,
	addReference,
	amount,
	disabled,
	setLoaded,
}: Props) {
	const [isAction, setAction] = useState<boolean>(false);
	const [isHidden, setHidden] = useState<boolean>(false);
	const { address } = useAccount();

	const chainId = useChainId();
	const chain = WAGMI_CHAINS.find((c) => c.id == chainId) as AppKitNetwork;
	const isSameChain = recipientChain.name.toLowerCase() == chain.name.toLowerCase();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		try {
			setAction(true);

			let writeHash: Hash;

			if (isSameChain && addReference) {
				// transfer with reference
				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
					abi: BridgedFrankencoinABI,
					functionName: "transfer",
					args: [recipient, amount, reference],
				});
			} else if (isSameChain && !addReference) {
				// normal ccipBridgedFrankencoin transfer
				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
					abi: BridgedFrankencoinABI,
					functionName: "transfer",
					args: [recipient, amount],
				});
			} else {
				// cross chain transfer with reference
				const overwriteABI = [
					{
						inputs: [
							{
								internalType: "uint64",
								name: "targetChain",
								type: "uint64",
							},
							{
								internalType: "address",
								name: "recipient",
								type: "address",
							},
							{
								internalType: "uint256",
								name: "amount",
								type: "uint256",
							},
							{
								internalType: "string",
								name: "ref",
								type: "string",
							},
						],
						name: "transfer",
						outputs: [
							{
								internalType: "bool",
								name: "",
								type: "bool",
							},
						],
						stateMutability: "payable",
						type: "function",
					},
				] as const;

				writeHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
					abi: overwriteABI,
					functionName: "transfer",
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
		<GuardSupportedChain chain={chain}>
			<Button className="h-10" disabled={isHidden || disabled} isLoading={isAction} onClick={(e) => handleOnClick(e)}>
				Transfer
			</Button>
		</GuardSupportedChain>
	);
}
