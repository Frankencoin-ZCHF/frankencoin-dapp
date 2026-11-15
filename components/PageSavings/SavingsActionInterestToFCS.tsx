import { useState } from "react";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { formatCurrency } from "@utils";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { useConnection } from "wagmi";
import AppButton from "@components/AppButton";
import { Address, erc20Abi, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { track } from "@hooks";
import { ADDRESS, FCSABI, SavingsABI } from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	savingsModule: Address;
	saved: bigint;
	interest: bigint;
	disabled?: boolean;
	onSuccess?: () => void;
}

// accept up to 0.5% fewer shares than quoted, the FCS price moves with every deposit
const MIN_SHARES_PPM = 995_000n;

/**
 * Puts the accrued interest into Frankencoin Shares (FCS), mainnet only. There is no contract that does this
 * in one call, so the button chains the transactions: adjust(saved) pays the interest out to the wallet,
 * then (after an approval, if the allowance is too low) exactly that payout is deposited into FCS.
 */
export default function SavingsActionInterestToFCS({ savingsModule, saved, interest, disabled, onSuccess }: Props) {
	const [step, setStep] = useState<string>("");
	const { address } = useConnection();
	const chainId = mainnet.id;
	const zchf = ADDRESS[chainId].frankencoin;
	const fcs = ADDRESS[chainId].fcs;

	const balanceOf = (owner: Address) =>
		readContract(WAGMI_CONFIG, { address: zchf, chainId, abi: erc20Abi, functionName: "balanceOf", args: [owner] });

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!address) return;

		let withdrawn = 0n;
		try {
			// 1. pay the interest out to the wallet
			setStep("Withdrawing interest...");
			const before = await balanceOf(address);
			const withdrawHash = await writeContract(WAGMI_CONFIG, {
				account: address,
				address: savingsModule,
				chainId,
				abi: SavingsABI,
				functionName: "adjust",
				args: [saved],
			});
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: withdrawHash, chainId, confirmations: 1 }), {
				pending: {
					render: (
						<TxToast
							title="Withdrawing interest..."
							rows={[
								{ title: "Interest: ", value: `~${formatCurrency(formatUnits(interest, 18))} ZCHF` },
								{ title: "Transaction: ", hash: withdrawHash },
							]}
						/>
					),
				},
				success: {
					render: <TxToast title="Interest withdrawn, next: buy FCS" rows={[{ title: "Transaction: ", hash: withdrawHash }]} />,
				},
			});
			const after = await balanceOf(address);
			withdrawn = after > before ? after - before : interest;

			// 2. approve, only if needed
			const allowance = await readContract(WAGMI_CONFIG, {
				address: zchf,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [address, fcs],
			});
			if (allowance < withdrawn) {
				setStep("Approving ZCHF...");
				const approveHash = await writeContract(WAGMI_CONFIG, {
					account: address,
					address: zchf,
					chainId,
					abi: erc20Abi,
					functionName: "approve",
					args: [fcs, withdrawn],
				});
				await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveHash, chainId, confirmations: 1 }), {
					pending: { render: <TxToast title="Approving ZCHF" rows={[{ title: "Transaction: ", hash: approveHash }]} /> },
					success: { render: <TxToast title="ZCHF approved" rows={[{ title: "Transaction: ", hash: approveHash }]} /> },
				});
			}

			// 3. buy FCS with exactly what was paid out
			setStep("Buying FCS...");
			const shares = await readContract(WAGMI_CONFIG, {
				address: fcs,
				chainId,
				abi: FCSABI,
				functionName: "previewDeposit",
				args: [withdrawn],
			});
			const depositHash = await writeContract(WAGMI_CONFIG, {
				account: address,
				address: fcs,
				chainId,
				abi: FCSABI,
				functionName: "depositExpected",
				args: [withdrawn, address, (shares * MIN_SHARES_PPM) / 1_000_000n],
			});
			const rows = [
				{ title: "Amount: ", value: `${formatCurrency(formatUnits(withdrawn, 18))} ZCHF` },
				{ title: "Shares: ", value: `~${formatCurrency(formatUnits(shares, 18), 2, 6)} FCS` },
				{ title: "Transaction: ", hash: depositHash },
			];
			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: depositHash, chainId, confirmations: 1 }), {
				pending: { render: <TxToast title="Buying FCS with your interest..." rows={rows} /> },
				success: { render: <TxToast title="Interest invested in FCS" rows={rows} /> },
			});

			track("interest_to_fcs", { amount: formatUnits(withdrawn, 18) });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
			if (withdrawn > 0n) {
				toast.info(
					`The interest (${formatCurrency(
						formatUnits(withdrawn, 18)
					)} ZCHF) is in your wallet. You can buy FCS on the Invest page.`
				);
			}
		} finally {
			setStep("");
			onSuccess?.();
		}
	};

	return (
		<GuardSupportedChain chain={mainnet}>
			<AppButton className="h-10" disabled={disabled} isLoading={step != ""} onClick={(e) => handleOnClick(e)}>
				{step != "" ? step : `Invest interest in FCS (${formatCurrency(formatUnits(interest, 18))} ZCHF)`}
			</AppButton>
		</GuardSupportedChain>
	);
}
