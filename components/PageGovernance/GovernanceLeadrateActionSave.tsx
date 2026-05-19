import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, EquityABI, SavingsABI } from "@frankencoin/zchf";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import AppButton from "@components/AppButton";
import NormalInput from "@components/Input/NormalInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import GuardQualifiedVoter from "@components/Guards/GuardQualifiedVoter";
import { useDelegationHelpers } from "@hooks";
import { formatCurrency, normalizeAddress } from "../../utils/format";
import { mainnet } from "viem/chains";
import { Address } from "viem";

const Module = normalizeAddress(ADDRESS[mainnet.id].savingsReferral);

const UINT40_MAX = 2n ** 40n - 1n;

function calcOverflowWarning(rate: number, created: number): string | null {
	if (rate <= 0) return null;
	const maxElapsed = Number(UINT40_MAX / BigInt(rate));
	const overflowTs = created + maxElapsed;
	const now = Math.floor(Date.now() / 1000);
	if (overflowTs <= now) return "Contract is bricked: uint40 overflow reached, rate changes will permanently revert.";
	const daysLeft = Math.floor((overflowTs - now) / 86400);
	if (daysLeft >= 90) return null;
	const d = new Date(overflowTs * 1000);
	return `Apply new rate before ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} (~${daysLeft}d) due to uint40 overflow in contract.`;
}

export default function GovernanceLeadrateActionSave() {
	const account = useConnection();
	const { helpers } = useDelegationHelpers(account.address);
	const rate = useSelector((state: RootState) => state.savings.leadrateRate.rate[mainnet.id]);

	const current = rate[Module];
	const [newRate, setNewRate] = useState<bigint>(BigInt(current.approvedRate));
	const [isHandling, setHandling] = useState(false);
	const [isHidden, setHidden] = useState(false);
	const [isDisabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(newRate === BigInt(rate[Module].approvedRate));
	}, [newRate, rate]);

	const overflowWarning = calcOverflowWarning(current.approvedRate, current.created);

	const handleOnClick = async (e: any) => {
		e.preventDefault();
		if (!account.address) return;
		try {
			setHandling(true);
			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: Module as Address,
				chainId: mainnet.id,
				abi: SavingsABI,
				functionName: "proposeChange",
				args: [parseInt(String(newRate)), helpers],
			});
			const toastContent = [
				{ title: "From: ", value: `${formatCurrency(current.approvedRate / 10000)}%` },
				{ title: "Proposing to: ", value: `${formatCurrency(parseInt(String(newRate)) / 10000)}%` },
				{ title: "Transaction: ", hash: writeHash },
			];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Proposing save rate change..." rows={toastContent} /> },
				success: { render: <TxToast title="Successfully proposed" rows={toastContent} /> },
			});
			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setHandling(false);
		}
	};

	return (
		<>
			<NormalInput
				symbol="%"
				label="Save Rate"
				placeholder="Change Rate"
				value={newRate.toString()}
				digit={4}
				onChange={(e) => setNewRate(BigInt(e))}
				warning={overflowWarning ?? undefined}
			/>
			<div className="h-10 mb-4">
				<GuardQualifiedVoter disabled={isDisabled || isHidden}>
					<GuardSupportedChain disabled={isDisabled || isHidden} chain={mainnet}>
						<AppButton disabled={isDisabled || isHidden} isLoading={isHandling} onClick={handleOnClick}>
							Propose Change
						</AppButton>
					</GuardSupportedChain>
				</GuardQualifiedVoter>
			</div>
		</>
	);
}
