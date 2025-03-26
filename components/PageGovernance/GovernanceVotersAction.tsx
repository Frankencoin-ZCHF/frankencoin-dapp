import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CONFIG_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorToast, renderErrorTxToast, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { VoteData } from "./GovernanceVotersTable";
import { ADDRESS, EquityABI } from "@deuro/eurocoin";
import { useTranslation } from "next-i18next";
interface Props {
	voter: VoteData;
	disabled?: boolean;
	connectedWallet?: boolean;
}

export default function GovernanceVotersAction({ voter, disabled, connectedWallet }: Props) {
	const [isDelegating, setDelegating] = useState<boolean>(false);
	const account = useAccount();
	const chainId = CONFIG_CHAIN().id;
	const [isHidden, setHidden] = useState<boolean>(false);
	const { t } = useTranslation();

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;
		const addr = voter.holder;

		try {
			setDelegating(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: EquityABI,
				functionName: "delegateVoteTo",
				args: [voter.holder],
			});

			const toastContent = [
				{
					title: `${t("governance.owner")}: `,
					value: shortenAddress(account.address),
				},
				{
					title: `${t("governance.delegate_to")}: `,
					value: shortenAddress(addr),
				},
				{
					title: t("common.txs.transaction"),
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${t("governance.txs.delegating_votes")}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`${t("governance.txs.successfully_delegated_votes")}`} rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setDelegating(false);
		}
	};

	return (
		<div className="">
			<GuardToAllowedChainBtn label={connectedWallet ? t("governance.txs.revoke") : t("governance.txs.delegate")} disabled={isHidden || disabled}>
				<div className="overflow-hidden">
					<Button
						className="h-10 scroll-nopeak"
						disabled={isHidden || disabled}
						isLoading={isDelegating}
						onClick={(e) => handleOnClick(e)}
					>
						{connectedWallet ? t("governance.txs.revoke") : t("governance.txs.delegate")}
					</Button>
				</div>
			</GuardToAllowedChainBtn>
		</div>
	);
}
