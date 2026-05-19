import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, Chain } from "viem";
import { ADDRESS, CCIPAdminABI, ChainId, SupportedChainsMap } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { shortenString } from "@utils";
import { ApiCCIPProposal } from "../../redux/slices/bridge.types";

interface Props {
	proposal: ApiCCIPProposal;
	disabled?: boolean;
}

function buildEnactCall(proposal: ApiCCIPProposal): { functionName: string; args: unknown[] } | null {
	if (!proposal.details) return null;
	try {
		const d = JSON.parse(proposal.details);
		switch (proposal.type) {
			case "AddChain":
				return {
					functionName: "applyAddChain",
					args: [
						{
							remoteChainSelector: BigInt(d.remoteChainSelector),
							remotePoolAddresses: d.remotePoolAddresses as `0x${string}`[],
							remoteTokenAddress: d.remoteTokenAddress as `0x${string}`,
							outboundRateLimiterConfig: {
								isEnabled: d.outboundRateLimiterConfig.isEnabled as boolean,
								capacity: BigInt(d.outboundRateLimiterConfig.capacity),
								rate: BigInt(d.outboundRateLimiterConfig.rate),
							},
							inboundRateLimiterConfig: {
								isEnabled: d.inboundRateLimiterConfig.isEnabled as boolean,
								capacity: BigInt(d.inboundRateLimiterConfig.capacity),
								rate: BigInt(d.inboundRateLimiterConfig.rate),
							},
						},
					],
				};
			case "RemoveChain":
				return { functionName: "applyRemoveChain", args: [BigInt(d.chain)] };
			case "RemotePoolUpdate":
				return {
					functionName: "applyRemotePoolUpdate",
					args: [{ add: d.add as boolean, chain: BigInt(d.chain), poolAddress: d.poolAddress as `0x${string}` }],
				};
			case "AdminTransfer":
				return { functionName: "applyAdminTransfer", args: [d.newAdmin as Address] };
			default:
				return null;
		}
	} catch {
		return null;
	}
}

export default function GovernanceCCIPAdminEnactAction({ proposal, disabled }: Props) {
	const [isEnacting, setEnacting] = useState(false);
	const [isHidden, setHidden] = useState(false);
	const account = useConnection();
	const chain = SupportedChainsMap[proposal.chainId as ChainId] as Chain;

	const handleOnClick = async (e: any) => {
		e.preventDefault();
		if (!account.address) return;

		const ccipAdmin = ADDRESS[proposal.chainId as ChainId]?.ccipAdmin;
		if (!ccipAdmin) return;

		const call = buildEnactCall(proposal);
		if (!call) return;

		try {
			setEnacting(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ccipAdmin,
				chainId: proposal.chainId,
				abi: CCIPAdminABI,
				functionName: call.functionName as any,
				args: call.args as any,
			});

			const toastContent = [
				{ title: "Proposal: ", value: shortenString(proposal.hash) },
				{ title: "Type: ", value: proposal.type ?? "—" },
				{ title: "Transaction: ", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Enacting proposal..." rows={toastContent} /> },
				success: { render: <TxToast title="Proposal enacted" rows={toastContent} /> },
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, CCIPAdminABI));
		} finally {
			setEnacting(false);
		}
	};

	return (
		<GuardSupportedChain disabled={isHidden || disabled} chain={chain}>
			<AppButton disabled={isHidden || disabled} isLoading={isEnacting} onClick={handleOnClick}>
				Enact
			</AppButton>
		</GuardSupportedChain>
	);
}
