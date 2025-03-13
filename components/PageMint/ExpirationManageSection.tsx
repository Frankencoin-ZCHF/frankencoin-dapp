import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { DetailsExpandablePanel } from "@components/DetailsExpandablePanel";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import { renderErrorTxToast } from "@components/TxToast";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ADDRESS, PositionRollerABI } from "@deuro/eurocoin";
import { useRouter } from "next/router";
import { writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useBlock, useChainId } from "wagmi";
import { Address } from "viem/accounts";
import { toDate, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@deuro/api";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import Button from "@components/Button";
import { erc20Abi, maxUint256 } from "viem";

export const ExpirationManageSection = () => {
	const [expirationDate, setExpirationDate] = useState<Date | undefined | null>(undefined);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	const { t } = useTranslation();
	const chainId = useChainId();

	const router = useRouter();
	const { address: positionAddress } = router.query;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == positionAddress) as PositionQuery;

	const challenges = useSelector((state: RootState) => state.challenges.list.list);
	const challengedPositions = challenges.filter((c) => c.status === "Active").map((c) => c.position);

	const [targetPosition] = useMemo(() => {
		const now = new Date().getTime() / 1000;
		return positions
			.filter((p) => p.collateral.toLowerCase() === position.collateral.toLowerCase())
			.filter((p) => !challengedPositions.includes(p.position))
			.filter((p) => now > toTimestamp(toDate(p.cooldown)))
			.filter((p) => now < toTimestamp(toDate(p.expiration)))
			.filter((p) => !p.closed)
			.filter((p) => toTimestamp(toDate(p.expiration)) > toTimestamp(toDate(position.expiration)))
			.filter((p) => BigInt(p.availableForClones) > 0n)
			.filter((p) => BigInt(p.availableForMinting) > 0n)
			.sort((a, b) => toTimestamp(toDate(a.expiration)) - toTimestamp(toDate(b.expiration)));
	}, [positions, challengedPositions]);

	const { balancesByAddress } = useWalletERC20Balances([
		{
			symbol: position.collateralSymbol,
			address: position.collateral,
			name: position.collateralSymbol,
			allowance: [ADDRESS[chainId].roller],
		},
	]);

	const allowance = balancesByAddress[position.collateral]?.allowance?.[ADDRESS[chainId].roller];

	useEffect(() => {
		setExpirationDate(new Date(position.expiration * 1000));
	}, [position]);

	if (!position) return null;

	const handleExtendExpiration = async () => {
		try {
			setIsTxOnGoing(true);

			const extendingHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].roller,
				abi: PositionRollerABI,
				functionName: "rollFullyWithExpiration",
				args: [positionAddress as Address, targetPosition?.position as Address, toTimestamp(expirationDate as Date)],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: extendingHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: extendingHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.extending")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.extending_success")} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const handleApprove = async () => {
		try {
			setIsTxOnGoing(true);

			const approvingHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].roller, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: approvingHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approvingHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.approving")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.approving_success")} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	return (
		<div className="flex flex-col gap-y-8">
			<div className="flex flex-col gap-y-1.5">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.current_expiration_date")}</div>
				<DateInputOutlined
					maxDate={targetPosition?.expiration ? new Date(targetPosition.expiration * 1000) : undefined}
					value={expirationDate}
					placeholderText={new Date(position.expiration * 1000).toISOString().split("T")[0]}
					className="placeholder:text-[#5D647B]"
					onChange={setExpirationDate}
					rightAdornment={
						<MaxButton
							className="h-full py-3.5 px-3"
							onClick={handleExtendExpiration}
							disabled={isTxOnGoing || !targetPosition}
							label={t("mint.extend_roll_borrowing")}
						/>
					}
				/>
				<span className="text-xs font-medium leading-[1rem]">{t("mint.extend_roll_borrowing_description")}</span>
			</div>
			{!allowance ? (
				<Button
					className="text-lg leading-snug !font-extrabold"
					onClick={handleApprove}
					isLoading={isTxOnGoing}
					disabled={isTxOnGoing}
				>
					{t("common.approve")}
				</Button>
			) : null}
			<DetailsExpandablePanel loanDetails={undefined} collateralPriceDeuro={0} />
		</div>
	);
};
