import { DateInputOutlined } from "@components/Input/DateInputOutlined";
import { MaxButton } from "@components/Input/MaxButton";
import { DetailsExpandablePanel } from "@components/DetailsExpandablePanel";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { renderErrorTxToast } from "@components/TxToast";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ADDRESS, PositionRollerABI } from "@deuro/eurocoin";
import { useRouter } from "next/router";
import { writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useChainId } from "wagmi";
import { Address } from "viem/accounts";
import { toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@deuro/api";

export const ExpirationManageSection = () => {
	const [expirationDate, setExpirationDate] = useState<Date | undefined | null>(undefined);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	
	const router = useRouter();
	const { address: positionAddress } = router.query;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == positionAddress) as PositionQuery;
	const chainId = useChainId();
	const { t } = useTranslation();

	useEffect(() => {
		setExpirationDate(new Date(position.expiration * 1000));
	}, [position]);

	if(!position) return null;

	const handleExtendExpiration = async () => {
		try {
			setIsTxOnGoing(true);

			// TODO: this is not working, check if it's correct
			const extendingHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].roller,
				abi: PositionRollerABI,
				functionName: "rollFullyWithExpiration",
				args: [positionAddress as Address, position.original as Address, toTimestamp(expirationDate as Date)],
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
	}

	return (
		<div className="flex flex-col gap-y-8">
			<div className="flex flex-col gap-y-1.5">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.current_expiration_date")}</div>
				<DateInputOutlined
					value={expirationDate}
					placeholderText={new Date(position.expiration * 1000).toISOString().split("T")[0]}
					className="placeholder:text-[#5D647B]"
					onChange={setExpirationDate}
					rightAdornment={<MaxButton className="h-full py-3.5 px-3" onClick={handleExtendExpiration} disabled={isTxOnGoing} label={t("mint.extend_roll_borrowing")} />}
				/>
				<span className="text-xs font-medium leading-[1rem]">{t("mint.extend_roll_borrowing_description")}</span>
			</div>
			<DetailsExpandablePanel loanDetails={undefined} collateralPriceDeuro={0} />
		</div>
	);
};
