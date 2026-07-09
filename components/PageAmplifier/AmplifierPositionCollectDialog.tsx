import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import AppDialog from "@components/AppDialog";
import AppButton from "@components/AppButton";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../app.config";
import { AmplifierStats } from "../../hooks/useAmplifier";
import { AmplifiedPositionInfo, useAmplifiedPositionFees } from "../../hooks/useAmplifiedPositions";
import { AmplifiedPositionABI } from "../../abis/UniswapAmplifier";
import { formatBigInt, shortenAddress } from "@utils";

interface Props {
	stats: AmplifierStats;
	position: AmplifiedPositionInfo;
	onClose: () => void;
}

/**
 * Dialog to collect the accrued trading fees of a position without touching its
 * liquidity. Implemented as a burn of zero liquidity, which pokes the position
 * and collects everything the pool owes it.
 */
export default function AmplifierPositionCollectDialog({ stats, position, onClose }: Props) {
	const [isCollecting, setCollecting] = useState(false);
	const { fees0, fees1, isLoading } = useAmplifiedPositionFees(stats.pool, stats.currentTick, position);

	const usdSymbol = stats.usdSymbol || "USD";
	const usdFees = stats.zchfIsToken0 ? fees1 : fees0;
	const zchfFees = stats.zchfIsToken0 ? fees0 : fees1;
	const nothingToCollect = !isLoading && usdFees == 0n && zchfFees == 0n;

	const handleCollect = async () => {
		try {
			setCollecting(true);
			const collectWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.address,
				chainId: stats.chainId,
				abi: AmplifiedPositionABI,
				functionName: "burn",
				args: [0n, stats.priceX96],
			});

			const toastContent = [
				{ title: `${usdSymbol} Fees: `, value: formatBigInt(usdFees, stats.usdDecimals) + " " + usdSymbol },
				{ title: `${stats.zchfSymbol} Fees: `, value: formatBigInt(zchfFees) + " " + stats.zchfSymbol },
				{ title: "Transaction:", hash: collectWriteHash },
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: collectWriteHash, confirmations: 1 }), {
				pending: { render: <TxToast title="Collecting Fees" rows={toastContent} /> },
				success: { render: <TxToast title="Successfully Collected Fees" rows={toastContent} /> },
			});
			onClose();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCollecting(false);
		}
	};

	return (
		<AppDialog title="Collect Fees" isOpen={true} onClose={onClose} preventClose={isCollecting}>
			<div className="text-text-secondary">
				Collect the trading fees accrued by position {shortenAddress(position.address)} without changing its liquidity.
			</div>

			<div className="grid grid-cols-2 gap-4">
				<DisplayLabel label={`Claimable ${usdSymbol}`}>
					<DisplayAmount amount={usdFees} digits={stats.usdDecimals} unit={usdSymbol} />
				</DisplayLabel>
				<DisplayLabel label={`Claimable ${stats.zchfSymbol}`}>
					<DisplayAmount amount={zchfFees} digits={18} unit={stats.zchfSymbol} />
				</DisplayLabel>
			</div>

			<GuardSupportedChain>
				<AppButton
					disabled={nothingToCollect}
					isLoading={isCollecting}
					onClick={() => handleCollect()}
					note={nothingToCollect ? "There are no fees to collect yet." : ""}
				>
					Collect Fees
				</AppButton>
			</GuardSupportedChain>
		</AppDialog>
	);
}
