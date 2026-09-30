import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Chain, Hash } from "viem";
import { ADDRESS, CCIPAdminABI, CCIPGovernanceABI, ChainId, SupportedChainsMap } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import GuardQualifiedVoter from "@components/Guards/GuardQualifiedVoter";
import { useQualifiedVotingSystem } from "@hooks";
import { shortenString } from "@utils";
import { ApiCCIPProposal } from "../../redux/slices/bridge.types";

interface Props {
	proposal: ApiCCIPProposal;
	disabled?: boolean;
}

export default function GovernanceCCIPAdminDenyAction({ proposal, disabled }: Props) {
	const [isDenying, setDenying] = useState(false);
	const [isHidden, setHidden] = useState(false);
	const account = useConnection();
	const { system, helpers } = useQualifiedVotingSystem(account.address);
	const chain = SupportedChainsMap[proposal.chainId as ChainId] as Chain;

	const handleOnClick = async (e: any) => {
		e.preventDefault();
		if (!account.address) return;

		const ccipAdmin = ADDRESS[proposal.chainId as ChainId]?.ccipAdmin;
		const ccipGovernance = (ADDRESS as any)[proposal.chainId]?.ccipGovernance;
		if (!ccipAdmin || (system === "fcs" && !ccipGovernance)) return;

		try {
			setDenying(true);

			// FCS-qualified callers go through CCIPGovernance (per-chain, like CCIPAdmin itself) instead
			// of CCIPAdmin directly — CCIPAdmin.deny checks the caller's Equity-side qualification, which
			// an FCS-only holder doesn't have.
			const writeHash =
				system === "fcs"
					? await writeContract(WAGMI_CONFIG, {
							address: ccipGovernance,
							chainId: proposal.chainId,
							abi: CCIPGovernanceABI,
							functionName: "deny",
							args: [proposal.hash as Hash, helpers],
					  })
					: await writeContract(WAGMI_CONFIG, {
							address: ccipAdmin,
							chainId: proposal.chainId,
							abi: CCIPAdminABI,
							functionName: "deny",
							args: [proposal.hash as Hash, helpers],
					  });

			const toastContent = [
				{ title: "Proposal: ", value: shortenString(proposal.hash) },
				{ title: "Type: ", value: proposal.type ?? "—" },
				{ title: "Transaction: ", hash: writeHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Denying proposal..." rows={toastContent} /> },
				success: { render: <TxToast title="Proposal denied" rows={toastContent} /> },
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, system === "fcs" ? CCIPGovernanceABI : CCIPAdminABI));
		} finally {
			setDenying(false);
		}
	};

	return (
		<GuardQualifiedVoter disabled={isHidden || disabled}>
			<GuardSupportedChain disabled={isHidden || disabled} chain={chain}>
				<AppButton disabled={isHidden || disabled} isLoading={isDenying} onClick={handleOnClick}>
					Deny
				</AppButton>
			</GuardSupportedChain>
		</GuardQualifiedVoter>
	);
}
