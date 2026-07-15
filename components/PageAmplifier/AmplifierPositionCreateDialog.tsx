import { useEffect, useRef, useState } from "react";
import { Address, decodeEventLog, formatUnits, parseUnits } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import AppDialog from "@components/AppDialog";
import AppButton from "@components/AppButton";
import NormalInput from "@components/Input/NormalInput";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../app.config";
import { AmplifierPriceView, AmplifierStats } from "../../hooks/useAmplifier";
import { UniswapAmplifierABI } from "../../abis/UniswapAmplifier";
import { FormatType, formatCurrency, isDateExpired } from "@utils";
import { snapTick } from "../../utils/uniswapV3Math";
import { amplificationThresholdTick } from "../../utils/amplifierMath";

const DEFAULT_SPAN = 1.03; // default range spans 3%
const DEFAULT_SAFETY = 0.999; // placed so liquidity can still be added after a 0.1% price drop

interface Props {
	stats: AmplifierStats;
	priceView: AmplifierPriceView;
	onClose: () => void;
	onCreated: (position: Address) => void;
}

/**
 * Dialog to create a new amplified position with a chosen price range. After the
 * transaction confirms, the new position's address is reported via onCreated.
 */
export default function AmplifierPositionCreateDialog({ stats, priceView, onClose, onCreated }: Props) {
	const [lower, setLower] = useState("");
	const [upper, setUpper] = useState("");
	const [isCreating, setCreating] = useState(false);
	const prefilled = useRef(false);

	const priceUnit = priceView.unit;
	const ready = stats.usdPerZchf > 0 && stats.tickSpacing > 0;

	// prefill with a range spanning DEFAULT_SPAN, placed as high as possible while the price
	// can still drop to DEFAULT_SAFETY of the current value with liquidity remaining addable
	useEffect(() => {
		if (prefilled.current || !ready) return;
		prefilled.current = true;

		const spacing = stats.tickSpacing;
		const minValid = Math.ceil(stats.minimumTick / spacing) * spacing;
		const maxValid = Math.floor(stats.maximumTick / spacing) * spacing;
		const spanTicks = Math.min(
			maxValid - minValid,
			Math.max(spacing, Math.round(Math.log(DEFAULT_SPAN) / Math.log(1.0001) / spacing) * spacing)
		);
		const steps = Math.floor((maxValid - spanTicks - minValid) / spacing);

		// placements indexed by ascending human price; the safety constraint holds for low
		// placements and breaks as the range moves above the price, so bisect for the highest safe one
		const target = stats.usdPerZchf * DEFAULT_SAFETY;
		const tickLowAt = (j: number) => (stats.zchfIsToken0 ? minValid + j * spacing : maxValid - spanTicks - j * spacing);
		const isSafe = (j: number) => {
			const tickLow = tickLowAt(j);
			const threshold = amplificationThresholdTick(tickLow, tickLow + spanTicks, stats.priceAnchorX96, !stats.zchfIsToken0);
			return stats.usdPerZchfAtTick(threshold) <= target;
		};

		let best = 0;
		if (isSafe(0)) {
			if (isSafe(steps)) {
				best = steps;
			} else {
				let lo = 0;
				let hi = steps;
				while (hi - lo > 1) {
					const mid = (lo + hi) >> 1;
					if (isSafe(mid)) lo = mid;
					else hi = mid;
				}
				best = lo;
			}
		}

		const tickLow = tickLowAt(best);
		const priceAtLow = priceView.atTick(tickLow);
		const priceAtHigh = priceView.atTick(tickLow + spanTicks);
		setLower(parseUnits(Math.min(priceAtLow, priceAtHigh).toFixed(6), 18).toString());
		setUpper(parseUnits(Math.max(priceAtLow, priceAtHigh).toFixed(6), 18).toString());
	}, [ready, stats, priceView]);

	const lowerPrice = Number(formatUnits(BigInt(lower || "0"), 18));
	const upperPrice = Number(formatUnits(BigInt(upper || "0"), 18));

	const minTickAllowed = stats.minimumTick;
	const maxTickAllowed = stats.maximumTick;
	const priceAtMinTick = priceView.atTick(minTickAllowed);
	const priceAtMaxTick = priceView.atTick(maxTickAllowed);
	const allowedLow = Math.min(priceAtMinTick, priceAtMaxTick);
	const allowedHigh = Math.max(priceAtMinTick, priceAtMaxTick);
	const minValidTick = ready ? Math.ceil(minTickAllowed / stats.tickSpacing) * stats.tickSpacing : 0;
	const maxValidTick = ready ? Math.floor(maxTickAllowed / stats.tickSpacing) * stats.tickSpacing : 0;

	// fill an input from a computed price; the bounds are nudged inwards so that the 6-decimal
	// rounding cannot push the requested price outside the allowed band
	const fillPrice = (setter: (value: string) => void, price: number, round: "up" | "down" | "nearest") => {
		const factor = 1e6;
		const rounded =
			round === "up" ? Math.ceil(price * factor) / factor : round === "down" ? Math.floor(price * factor) / factor : price;
		setter(parseUnits(rounded.toFixed(6), 18).toString());
	};

	// whether a range would be amplifiable at the current price — the SAME criterion the
	// threshold note below the inputs uses, so a matched range never triggers its warning
	const amplifiable = (lowT: number, highT: number): boolean => {
		const thresholdTick = amplificationThresholdTick(lowT, highT, stats.priceAnchorX96, !stats.zchfIsToken0);
		return stats.zchfPerUsdAtTick(thresholdTick) >= stats.pricePerUsd;
	};

	// The price for one end of the range (the other end fixed) that shifts the position as far
	// towards borrowed ZCHF as the minimum-dollars rule allows at the current pool price: the
	// most ZCHF-rich (lowest ZCHF-per-USD) valid tick whose range is still amplifiable.
	const findMatchTick = (fixedPrice: number, movableIsDisplayedUpper: boolean): number | undefined => {
		if (!ready || fixedPrice <= 0 || stats.sqrtPriceX96 <= 0n) return undefined;
		const fixedTick = snapTick(priceView.tickAt(fixedPrice), stats.tickSpacing, minValidTick, maxValidTick);
		const fixedDisplayed = priceView.atTick(fixedTick);
		let best: number | undefined;
		let bestCanonical = Infinity;
		for (let tick = minValidTick; tick <= maxValidTick; tick += stats.tickSpacing) {
			const displayed = priceView.atTick(tick);
			if (movableIsDisplayedUpper ? displayed <= fixedDisplayed : displayed >= fixedDisplayed) continue;
			if (!amplifiable(Math.min(tick, fixedTick), Math.max(tick, fixedTick))) continue;
			const canonical = stats.zchfPerUsdAtTick(tick);
			if (canonical < bestCanonical) {
				bestCanonical = canonical;
				best = tick;
			}
		}
		return best;
	};

	const matchUpper = () => {
		const tick = findMatchTick(lowerPrice, true);
		if (tick !== undefined) fillPrice(setUpper, priceView.atTick(tick), "nearest");
	};
	const matchLower = () => {
		const tick = findMatchTick(upperPrice, false);
		if (tick !== undefined) fillPrice(setLower, priceView.atTick(tick), "nearest");
	};

	// how far an entered price is from the current market price
	const priceNote = (price: number): string => {
		if (!ready || price <= 0 || priceView.current <= 0) return "";
		const pct = (price / priceView.current - 1) * 100;
		if (Math.abs(pct) < 0.005) return "At the current market price.";
		return `${Math.abs(pct).toFixed(2)}% ${pct > 0 ? "above" : "below"} the current market price.`;
	};

	let error = "";
	let tickLow = 0;
	let tickHigh = 0;
	if (ready && lowerPrice > 0 && upperPrice > 0) {
		const tickAtLower = priceView.tickAt(lowerPrice);
		const tickAtUpper = priceView.tickAt(upperPrice);
		const requestedLow = Math.min(tickAtLower, tickAtUpper);
		const requestedHigh = Math.max(tickAtLower, tickAtUpper);

		// snap to the pool's tick spacing within the amplifier's allowed tick band
		tickLow = snapTick(requestedLow, stats.tickSpacing, minValidTick, maxValidTick);
		tickHigh = snapTick(requestedHigh, stats.tickSpacing, minValidTick, maxValidTick);

		if (lowerPrice >= upperPrice) {
			error = "The lower price must be below the upper price.";
		} else if (requestedLow < minTickAllowed || requestedHigh > maxTickAllowed) {
			error = `Prices must be within ${formatCurrency(allowedLow, 2, 4, FormatType.us)} and ${formatCurrency(
				allowedHigh,
				2,
				4,
				FormatType.us
			)} ${priceUnit}.`;
		} else if (tickLow >= tickHigh) {
			error = "The range is too narrow for the pool's tick spacing.";
		}
	}
	if (stats.expiration > 0n && isDateExpired(stats.expiration)) {
		error = "This amplifier has expired, no new liquidity can be amplified.";
	}

	const effectiveLow = tickLow < tickHigh ? Math.min(priceView.atTick(tickLow), priceView.atTick(tickHigh)) : 0;
	const effectiveHigh = tickLow < tickHigh ? Math.max(priceView.atTick(tickLow), priceView.atTick(tickHigh)) : 0;
	const valid = !error && tickLow < tickHigh;

	// how far the dollar may appreciate before the minimum-dollars rule blocks adding liquidity;
	// a strengthening dollar RISES in the default orientation and FALLS in the inverted one
	let thresholdNote = "";
	let thresholdWarning = "";
	if (valid && stats.usdPerZchf > 0) {
		const thresholdTick = amplificationThresholdTick(tickLow, tickHigh, stats.priceAnchorX96, !stats.zchfIsToken0);
		const thresholdPrice = priceView.atTick(thresholdTick);
		if (stats.zchfPerUsdAtTick(thresholdTick) >= stats.pricePerUsd) {
			const movePct = Math.abs(thresholdPrice / priceView.current - 1) * 100;
			thresholdNote = `You will be able to add liquidity as long as the price stays ${
				priceView.inverted ? "above" : "below"
			} ${formatCurrency(thresholdPrice, 2, 4, FormatType.us)} ${priceUnit}, i.e. until it ${
				priceView.inverted ? "falls" : "rises"
			} more than ${movePct.toFixed(2)}% ${priceView.inverted ? "below" : "above"} the current price.`;
		} else {
			thresholdWarning = `At the current price of ${formatCurrency(
				priceView.current,
				2,
				4,
				FormatType.us
			)} ${priceUnit}, you could not add liquidity to this range — the price would first have to ${
				priceView.inverted ? "rise above" : "fall below"
			} ${formatCurrency(thresholdPrice, 2, 4, FormatType.us)} ${priceUnit}. Choose a ${
				priceView.inverted ? "lower" : "higher"
			} range to leave room for the price to ${priceView.inverted ? "fall" : "rise"}.`;
		}
	}

	const handleCreate = async () => {
		if (!stats.address || !valid) return;
		try {
			setCreating(true);
			const createWriteHash = await writeContract(WAGMI_CONFIG, {
				address: stats.address,
				chainId: stats.chainId,
				abi: UniswapAmplifierABI,
				functionName: "createAmplifiedPosition",
				args: [tickLow, tickHigh],
			});

			const toastContent = [
				{
					title: "Price Range:",
					value: `${formatCurrency(effectiveLow, 2, 4, FormatType.us)} - ${formatCurrency(
						effectiveHigh,
						2,
						4,
						FormatType.us
					)} ${priceUnit}`,
				},
				{
					title: "Transaction:",
					hash: createWriteHash,
				},
			];

			const receipt = await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: createWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title="Creating Amplified Position" rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Created Position" rows={toastContent} />,
				},
			});

			for (const log of receipt.logs) {
				if (log.address.toLowerCase() !== stats.address.toLowerCase()) continue;
				try {
					const event = decodeEventLog({ abi: UniswapAmplifierABI, data: log.data, topics: log.topics });
					if (event.eventName === "AmplifiedPositionCreated") {
						onCreated(event.args.position);
						break;
					}
				} catch {}
			}
			onClose();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCreating(false);
		}
	};

	return (
		<AppDialog title="Create Position" isOpen={true} onClose={onClose} preventClose={isCreating}>
			<div className="text-text-secondary">
				An amplified position provides liquidity to the Uniswap pool within your chosen price range. You only provide{" "}
				{stats.usdSymbol || "dollars"} — the {stats.zchfSymbol} side is borrowed from the Frankencoin protocol. As soon as the
				position is created, you can add liquidity in a separate step.
			</div>

			<div className="grid grid-cols-1 gap-4">
				<NormalInput
					label="Upper Price"
					symbol={priceUnit}
					digit={18}
					value={upper}
					onChange={(value: string) => setUpper(value)}
					placeholder="Upper Price"
					note={priceNote(upperPrice)}
					actions={[
						...(ready && lowerPrice > 0 ? [{ label: "Match", onClick: matchUpper }] : []),
						...(ready ? [{ label: "Max", onClick: () => fillPrice(setUpper, allowedHigh, "down") }] : []),
					]}
				/>
				<NormalInput
					label="Lower Price"
					symbol={priceUnit}
					digit={18}
					value={lower}
					onChange={(value: string) => setLower(value)}
					placeholder="Lower Price"
					note={priceNote(lowerPrice)}
					actions={[
						...(ready && upperPrice > 0 ? [{ label: "Match", onClick: matchLower }] : []),
						...(ready ? [{ label: "Min", onClick: () => fillPrice(setLower, allowedLow, "up") }] : []),
					]}
				/>
			</div>

			<div className={error ? "text-text-warning" : "text-text-secondary"}>
				{error
					? error
					: valid
					? `Effective range after snapping to the pool's tick spacing: ${formatCurrency(
							effectiveLow,
							2,
							4,
							FormatType.us
					  )} - ${formatCurrency(effectiveHigh, 2, 4, FormatType.us)} ${priceUnit}`
					: ""}
			</div>

			{!error && valid && thresholdWarning !== "" && <div className="text-amber-500">{thresholdWarning}</div>}
			{!error && valid && thresholdWarning === "" && <div className="text-text-secondary">{thresholdNote}</div>}

			<GuardSupportedChain>
				<AppButton disabled={!valid} isLoading={isCreating} onClick={() => handleCreate()}>
					Create Position
				</AppButton>
			</GuardSupportedChain>
		</AppDialog>
	);
}
