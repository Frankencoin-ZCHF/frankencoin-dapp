import { useEffect, useState } from "react";
import { useMyReferrals } from "@hooks";
import { useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useTranslation } from "next-i18next";
import { ADDRESS, FrontendGatewayABI } from "@deuro/eurocoin";
import { formatUnits, zeroAddress } from "viem";
import { WAGMI_CONFIG } from "../../app.config";
import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import { SecondaryButton } from "@components/Button";
import Image from "next/image";
import { toast } from "react-toastify";
import { renderErrorTxToast, TxToast } from "@components/TxToast";

export const ReferralsStats = () => {
	const { myFrontendCode, totalVolume, totalReffered } = useMyReferrals();
	const [availableToClaim, setAvailableToClaim] = useState(0n);
	const [isClaiming, setIsClaiming] = useState(false);
	const chainId = useChainId();
	const { t } = useTranslation();

	const fetchReferralsStats = async () => {
		if (!myFrontendCode) return;

		try {
			const [balance, owner] = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "frontendCodes",
				args: [myFrontendCode],
			});

			if (owner === zeroAddress) return;

			setAvailableToClaim(balance);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchReferralsStats();
	}, [myFrontendCode]);

	const handleClaim = async () => {
		if (!myFrontendCode) return;
		setIsClaiming(true);

		try {
			const tx = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "withdrawRewards",
				args: [myFrontendCode],
			});

			const toastContent = [
				{
					title: `${t("referrals.txs.referral_bonus")}`,
					value: `${formatCurrency(formatUnits(availableToClaim, 18))} ${TOKEN_SYMBOL}`,
				},
				{
					title: `${t("common.txs.transaction")}`,
					hash: tx,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: tx, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("referrals.txs.claiming_referral_bonus")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("referrals.txs.successfully_claimed_referral_bonus")} rows={toastContent} />,
				},
			});
			await fetchReferralsStats();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsClaiming(false);
		}
	};

	const hasReferrals = totalReffered  > 0;
	const hasAvailableToClaim = availableToClaim > 0;
	const hasTotalRewards = totalVolume > 0;

	return (
		<div className="self-stretch flex">
			<div className="flex-1 p-4 sm:p-8 border-r border-borders-primary flex-col justify-between items-center gap-4 inline-flex">
				<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
					{t("referrals.total_bonus_volume")}
				</div>
				<div className="justify-center items-center gap-2.5 inline-flex">
					<div
						className={`grow shrink basis-0 ${
							hasTotalRewards ? "" : "text-menu-wallet-bg"
						} text-xl sm:text-2xl font-extrabold leading-normal`}
					>
						€ {formatCurrency(formatUnits(totalVolume, 18))}
					</div>
				</div>
			</div>
			<div className="flex-1 p-4 sm:p-8 border-r border-borders-primary flex-col justify-between items-center gap-4 inline-flex">
				<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
					{t("referrals.available_to_claim")}
				</div>
				<div className="justify-center items-center gap-2.5 inline-flex">
					<div
						className={`grow shrink basis-0 ${
							hasAvailableToClaim ? "" : "text-menu-wallet-bg"
						} text-xl sm:text-2xl font-extrabold leading-normal`}
					>
						€ {formatCurrency(formatUnits(availableToClaim, 18))}
					</div>
					<div>
						<SecondaryButton
							className="py-2 leading-tight gap-1.5 border-none flex justify-center items-center"
							disabled={!hasAvailableToClaim || isClaiming}
							onClick={handleClaim}
						>
							<span>{t("referrals.claim")}</span>
							<Image src="/icons/ph_hand-coins-black.svg" alt="arrow-right" width={20} height={20} />
						</SecondaryButton>
					</div>
				</div>
			</div>
			<div className="flex-1 p-4 sm:p-8 flex-col justify-between items-center gap-4 inline-flex">
				<div className="text-text-primary text-sm sm:text-base text-center font-medium leading-tight">
					{t("referrals.total_referred")}
				</div>
				<div className="flex-col justify-center items-center gap-2.5 flex">
					<div
						className={`text-xl sm:text-2xl font-extrabold leading-normal ${
							hasReferrals ? "" : "text-menu-wallet-bg"
						}`}
					>
						{totalReffered}
					</div>
				</div>
			</div>
		</div>
	);
};
