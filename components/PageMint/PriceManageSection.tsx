import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { RootState } from "../../redux/redux.store";
import { PositionQuery } from "@deuro/api";
import { useSelector } from "react-redux";
import { Address, formatUnits } from "viem";
import { formatBigInt, formatCurrency, shortenAddress } from "@utils";
import { useChainId, useReadContracts } from "wagmi";
import { writeContract } from "wagmi/actions";
import { PositionV2ABI } from "@deuro/eurocoin";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { waitForTransactionReceipt } from "wagmi/actions";
import { renderErrorTxToast } from "@components/TxToast";
import { TxToast } from "@components/TxToast";
import { DetailsExpandablePanel } from "@components/PageMint/DetailsExpandablePanel";
import { SliderInputOutlined } from "@components/Input/SliderInputOutlined";
import Button from "@components/Button";
import Link from "next/link";
import { useContractUrl } from "../../hooks/useContractUrl";
import { getLoanDetailsByCollateralAndLiqPrice } from "../../utils/loanCalculations";
import { erc20Abi } from "viem";

export const PriceManageSection = () => {
	const router = useRouter();
	const [newPrice, setNewPrice] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	const { t } = useTranslation();
	const chainId = useChainId();

	const { address: addressQuery } = router.query;
	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const url = useContractUrl(position.position);

	const { data, refetch: refetchReadContracts } = useReadContracts({
		contracts: [
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "principal",
			},
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "price",
			},
			{
				chainId,
				abi: erc20Abi,
				address: position.collateral as Address,
				functionName: "balanceOf",
				args: [position.position],
			},
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "start",
			},
			{
				chainId,
				address: position.position,
				abi: PositionV2ABI,
				functionName: "getCollateralRequirement",
			},
		],
	});

	const principal = data?.[0]?.result || 0n;
	const currentPrice = data?.[1]?.result || 1n;
	const collateralBalance = data?.[2]?.result || 0n;
	const startTime = data?.[3]?.result || 0n;
	const collateralRequirement = data?.[4]?.result || 0n;
	const availableForMinting = BigInt(position.availableForMinting || "0");

	const collateralPrice = prices[position.collateral.toLowerCase() as Address]?.price?.eur || 0;
	const priceDecimals = 36 - position.collateralDecimals;

	let minPrice = 0n;
	const minimumCollateral = BigInt(position.minimumCollateral || "0");
	if (collateralBalance >= minimumCollateral && collateralBalance > 0n) {
		minPrice = (collateralRequirement * 10n ** 18n) / collateralBalance;
	}

	const bounds = principal + availableForMinting;
	const maxByBounds = collateralBalance > 0n ? (bounds * 10n ** 18n) / collateralBalance : 0n;
	const maxBy2x = startTime > 0n && BigInt(Math.floor(Date.now() / 1000)) >= startTime ? currentPrice * 2n : maxByBounds;
	const maxPrice = maxByBounds < maxBy2x ? maxByBounds : maxBy2x;

	const marketValueCollateral = collateralPrice * Number(formatUnits(collateralBalance, position.collateralDecimals));
	const positionValueCollateral =
		Number(formatUnits(collateralBalance, position.collateralDecimals)) *
		Number(formatUnits(BigInt(newPrice || currentPrice.toString()), priceDecimals));
	const collateralizationPercentage =
		positionValueCollateral > 0 ? Math.round((marketValueCollateral / positionValueCollateral) * 10000) / 100 : 0;

	useEffect(() => {
		if (minPrice > 0 && minPrice <= maxPrice) {
			const initialPrice = currentPrice > minPrice ? currentPrice : minPrice;
			setNewPrice(initialPrice.toString());
		}
	}, [currentPrice, minPrice, maxPrice]);

	const handleAdjustPrice = async () => {
		try {
			setIsTxOnGoing(true);

			const adjustPriceHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV2ABI,
				functionName: "adjustPrice",
				args: [BigInt(newPrice)],
			});

			const toastContent = [
				{
					title: t("common.txs.transaction"),
					hash: adjustPriceHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: adjustPriceHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("mint.txs.adjusting_price")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("mint.txs.adjusting_price_success")} rows={toastContent} />,
				},
			});
			await refetchReadContracts();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	useEffect(() => {
		if (minPrice > maxPrice) {
			setNewPrice("");
			setError(t("mint.error.insufficient_collateral_for_requirements"));
		} else if (!newPrice) {
			setError(null);
		} else {
			const priceBigInt = BigInt(newPrice);
			if (priceBigInt > maxPrice) {
				setNewPrice(maxPrice.toString());
				setError(null);
			} else if (priceBigInt < minPrice) {
				setNewPrice(minPrice.toString());
				setError(null);
			} else {
				setError(null);
			}
		}
	}, [newPrice, minPrice, maxPrice, t]);

	const loanDetails = getLoanDetailsByCollateralAndLiqPrice(position, collateralBalance, BigInt(newPrice || currentPrice.toString()));
	const eurPrice = useSelector((state: RootState) => state.prices.eur?.usd);

	return (
		<div className="flex flex-col gap-y-3">
			<div className="flex flex-row gap-x-1.5 pl-3">
				<div className="text-lg font-extrabold leading-[1.4375rem]">{t("mint.current_price")}</div>
				<div className="text-base font-medium">{formatCurrency(formatUnits(currentPrice, priceDecimals))} EUR</div>
			</div>

			<SliderInputOutlined
				value={newPrice}
				onChange={setNewPrice}
				min={minPrice}
				max={maxPrice}
				decimals={priceDecimals}
				isError={Boolean(error)}
				errorMessage={error ?? undefined}
				disabled={minPrice > maxPrice}
				usdPrice={formatCurrency(
					parseFloat(formatUnits(BigInt(newPrice || "0"), priceDecimals)) * (eurPrice || 0),
					2,
					2
				)?.toString()}
			/>

			<div className="w-full mt-1.5 px-4 py-2 rounded-xl bg-[#E4F0FC] flex flex-row justify-between items-center text-base font-extrabold text-[#272B38]">
				<span>{t("mint.collateralization")}</span>
				<span>{collateralizationPercentage} %</span>
			</div>

			<Button
				className="text-lg leading-snug !font-extrabold"
				onClick={handleAdjustPrice}
				isLoading={isTxOnGoing}
				disabled={Boolean(error) || !newPrice || newPrice === currentPrice.toString()}
			>
				{t("mint.adjust_price")}
			</Button>

			<DetailsExpandablePanel
				loanDetails={loanDetails}
				collateralPriceDeuro={collateralPrice}
				collateralDecimals={position.collateralDecimals}
				startingLiquidationPrice={BigInt(newPrice || currentPrice.toString())}
				extraRows={
					<div className="py-1.5 flex justify-between">
						<span className="text-base leading-tight">{t("common.position")}</span>
						<Link
							className="underline text-right text-sm font-extrabold leading-none tracking-tight"
							href={url}
							target="_blank"
						>
							{shortenAddress(position.position)}
						</Link>
					</div>
				}
			/>
		</div>
	);
};
