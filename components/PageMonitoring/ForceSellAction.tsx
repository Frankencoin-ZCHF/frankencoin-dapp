import { useEffect, useState } from "react";
import { PositionQuery } from "@frankencoin/api";
import { Address, formatUnits, parseUnits } from "viem";
import TokenInput from "@components/Input/TokenInput";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { formatBigInt, formatCurrency, normalizeAddress } from "@utils";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useConnection, useBlockNumber } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, FrankencoinABI, MintingHubV2ABI } from "@frankencoin/zchf";
import { toast } from "react-toastify";
import { track } from "@hooks";
import { mainnet } from "viem/chains";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
	const day = d.getDate();
	const mon = MONTHS[d.getMonth()];
	const yr = d.getFullYear();
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	const ss = String(d.getSeconds()).padStart(2, "0");
	return `${day} ${mon} ${yr} ${hh}:${mm}:${ss}`;
}

interface Props {
	position: PositionQuery;
	auctionPrice: bigint;
	onBidSuccess: () => void;
}

export default function ForceSellAction({ position, auctionPrice, onBidSuccess }: Props) {
	const [isInit, setInit] = useState(false);
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isBidding, setBidding] = useState(false);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useConnection();
	const chainId = mainnet.id;
	const priceDigits = 36 - position.collateralDecimals;
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const marketPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (!acc) return;

		const fetchAsync = async () => {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frankencoin,
				chainId,
				abi: FrankencoinABI,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);
		};

		fetchAsync();
	}, [data, account.address, chainId]);

	useEffect(() => {
		if (isInit) return;
		setAmount(BigInt(position.collateralBalance));
		setInit(true);
	}, [isInit, position]);

	const AVG_BLOCK_TIME_MS = 12_000;
	const marketPriceBigInt = marketPriceChf !== undefined ? parseUnits(marketPriceChf.toFixed(6), priceDigits) : undefined;
	const liqPriceBigInt = BigInt(position.price);
	const nowMs = Date.now();
	const startMs = position.expiration * 1000;
	const phaseMs = position.challengePeriod * 1000;
	const phase2StartMs = startMs + phaseMs;
	const endTimeMs = startMs + 2 * phaseMs;
	const remainingMs = Math.max(0, endTimeMs - nowMs);

	let marketReachedAt: string = "—";
	let estimatedBlockStr: string = "—";
	if (marketPriceBigInt !== undefined && auctionPrice > 0n && liqPriceBigInt > 0n) {
		if (auctionPrice <= marketPriceBigInt) {
			marketReachedAt = "Now";
			estimatedBlockStr = data !== undefined ? `#${Number(data).toLocaleString()}` : "—";
		} else if (remainingMs > 0) {
			let msUntilMarket: number;
			const inPhase1 = nowMs < phase2StartMs;
			if (inPhase1 && marketPriceBigInt > liqPriceBigInt) {
				// Both current and target price are in phase 1 range (10×→1× liqPrice)
				msUntilMarket = Number((BigInt(phaseMs) * (auctionPrice - marketPriceBigInt)) / (9n * liqPriceBigInt));
			} else if (inPhase1) {
				// Currently in phase 1, market price reached in phase 2 (1×→0)
				const remainingPhase1Ms = phase2StartMs - nowMs;
				const msInPhase2 = Number((BigInt(phaseMs) * (liqPriceBigInt - marketPriceBigInt)) / liqPriceBigInt);
				msUntilMarket = remainingPhase1Ms + msInPhase2;
			} else {
				// In phase 2 (1×→0 liqPrice)
				msUntilMarket = Number((BigInt(phaseMs) * (auctionPrice - marketPriceBigInt)) / liqPriceBigInt);
			}
			marketReachedAt = fmtDate(new Date(nowMs + msUntilMarket));
			if (data !== undefined) {
				estimatedBlockStr = `#${Number(data) + Math.round(msUntilMarket / AVG_BLOCK_TIME_MS)}`;
			}
		}
	}

	const expectedZCHF = (bidAmount?: bigint) => {
		if (!bidAmount) bidAmount = amount;
		return (bidAmount * auctionPrice) / BigInt(1e18);
	};

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (expectedZCHF(valueBigInt) > userBalance) {
			setError("Not enough ZCHF in your wallet to cover the expected costs.");
		} else if (valueBigInt > BigInt(position.collateralBalance)) {
			setError("Expected buying collateral should be lower than remaining collateral.");
		} else {
			setError("");
		}
	};

	const handleBid = async () => {
		try {
			setBidding(true);

			const bidWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].mintingHubV2,
				chainId,
				abi: MintingHubV2ABI,
				functionName: "buyExpiredCollateral",
				args: [position.position as Address, amount],
			});

			const toastContent = [
				{
					title: "ForceSell Amount: ",
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Expected ZCHF: ",
					value: formatCurrency(formatUnits(expectedZCHF(), 18)) + " ZCHF",
				},
				{
					title: "Transaction:",
					hash: bidWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: bidWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Force to Sell ${position.collateralSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Forced to Sell" rows={toastContent} />,
				},
			});

			track("position_force_sold", {
				collateral: position.collateralSymbol,
				amount: formatBigInt(amount, position.collateralDecimals),
			});
			onBidSuccess();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setBidding(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<TokenInput
				label="Buy Amount"
				min={BigInt(position.minimumCollateral)}
				max={BigInt(position.collateralBalance)}
				value={amount.toString()}
				onChange={onChangeAmount}
				digit={position.collateralDecimals}
				symbol={position.collateralSymbol}
				error={error}
				placeholder="Collateral Amount"
				limit={BigInt(position.collateralBalance)}
				limitDigit={position.collateralDecimals}
				limitLabel="Available"
			/>

			<div className="flex flex-col gap-1.5 text-sm">
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Available</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(BigInt(position.collateralBalance), position.collateralDecimals)} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between items-center mt-2">
					<span className="text-text-secondary">Price per unit</span>
					<span className="text-text-primary font-medium">
						{formatCurrency(formatUnits(auctionPrice, priceDigits), 2, 2)} ZCHF
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Market price</span>
					<span className="text-text-primary font-medium">
						{marketPriceChf !== undefined ? `${formatCurrency(marketPriceChf, 2, 2)} ZCHF` : "—"}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Reaches market price</span>
					<span className="text-text-primary font-medium">{marketReachedAt}</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Est. block</span>
					<span className="text-text-primary font-medium">{estimatedBlockStr}</span>
				</div>
				<div className="flex justify-between items-center mt-2">
					<span className="text-text-secondary">Your balance</span>
					<span className="text-text-primary font-medium">{formatCurrency(formatUnits(userBalance, 18), 2, 2)} ZCHF</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Estimated cost</span>
					<span className="text-text-primary font-medium">{formatCurrency(formatUnits(expectedZCHF(), 18), 2, 2)} ZCHF</span>
				</div>
			</div>

			<GuardSupportedChain chain={mainnet}>
				<AppButton
					disabled={amount === 0n || expectedZCHF() > userBalance || error !== ""}
					isLoading={isBidding}
					onClick={handleBid}
				>
					Force Sell
				</AppButton>
			</GuardSupportedChain>
		</div>
	);
}
