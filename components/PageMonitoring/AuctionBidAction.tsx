import { useEffect, useState } from "react";
import { PositionQuery, ChallengesQueryItem } from "@frankencoin/api";
import { Address, formatUnits, parseEther, parseUnits } from "viem";
import TokenInput from "@components/Input/TokenInput";
import AppButton from "@components/AppButton";
import AppLink from "@components/AppLink";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { ContractUrl, formatBigInt, formatCurrency, normalizeAddress, shortenAddress } from "@utils";
import { useConnection, useBlockNumber } from "wagmi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, FrankencoinABI, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
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
	challenge: ChallengesQueryItem;
	auctionPrice: bigint;
	onBidSuccess: () => void;
}

export default function AuctionBidAction({ position, challenge, auctionPrice, onBidSuccess }: Props) {
	const [isInit, setInit] = useState(false);
	const [amount, setAmount] = useState<bigint>(0n);
	const [error, setError] = useState("");
	const [isBidding, setBidding] = useState(false);
	const [userBalance, setUserBalance] = useState<bigint>(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useConnection();
	const chainId = mainnet.id;
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const marketPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;

	useEffect(() => {
		const acc: Address | undefined = account.address;
		const ADDR = ADDRESS[chainId];

		const fetchAsync = async function () {
			if (acc !== undefined) {
				const _balance = await readContract(WAGMI_CONFIG, {
					address: ADDR.frankencoin,
					chainId,
					abi: FrankencoinABI,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserBalance(_balance);
			}
		};

		fetchAsync();
	}, [data, account.address, chainId]);

	useEffect(() => {
		if (isInit) return;

		const _amount = challenge.size - challenge.filledSize;
		setAmount(_amount);

		setInit(true);
	}, [isInit, challenge]);

	// Validate after data is fetched
	useEffect(() => {
		if (!isInit) return;

		const remaining = BigInt(challenge.size) - BigInt(challenge.filledSize);
		const expected = (BigInt(amount) * auctionPrice) / parseEther("1");

		if (expected > userBalance) {
			setError("Not enough ZCHF in your wallet to cover the expected costs.");
		} else if (amount > remaining) {
			setError("Expected winning collateral should be lower than remaining collateral.");
		} else {
			setError("");
		}
	}, [isInit, amount, auctionPrice, userBalance, challenge]);

	const remainingSize = BigInt(challenge.size) - BigInt(challenge.filledSize);

	const AVG_BLOCK_TIME_MS = 12_000; // Ethereum mainnet PoS
	const priceDigits = 36 - position.collateralDecimals;
	const marketPriceBigInt = marketPriceChf !== undefined ? parseUnits(marketPriceChf.toFixed(6), priceDigits) : undefined;
	const startMs = parseInt(challenge.start.toString()) * 1000;
	const durationMs = parseInt(challenge.duration.toString()) * 1000;
	const timeToExpiration = startMs >= position.expiration * 1000 ? 0 : position.expiration * 1000 - startMs;
	const phase1Ms = Math.min(timeToExpiration, durationMs);
	const endTimeMs = startMs + phase1Ms + durationMs; // phase1 + phase2
	const remainingMs = Math.max(0, endTimeMs - Date.now());

	let marketReachedAt: string = "—";
	let estimatedBlockStr: string = "—";
	if (marketPriceBigInt !== undefined && auctionPrice > 0n) {
		if (auctionPrice <= marketPriceBigInt) {
			marketReachedAt = "Now";
			estimatedBlockStr = data !== undefined ? `#${Number(data).toLocaleString()}` : "—";
		} else if (remainingMs > 0) {
			const msUntilMarket = Number((BigInt(remainingMs) * (auctionPrice - marketPriceBigInt)) / auctionPrice);
			marketReachedAt = fmtDate(new Date(Date.now() + msUntilMarket));
			if (data !== undefined) {
				estimatedBlockStr = `#${Number(data) + Math.round(msUntilMarket / AVG_BLOCK_TIME_MS)}`;
			}
		}
	}

	// @dev: issues with amount conversion from string input. Reconvert to bigint.
	const expectedZCHF = (BigInt(amount) * auctionPrice) / parseEther("1");

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);

		const newExpectedZCHF = (BigInt(valueBigInt) * auctionPrice) / parseEther("1");
		if (newExpectedZCHF > userBalance) {
			setError("Not enough ZCHF in your wallet to cover the expected costs.");
		} else if (amount > remainingSize) {
			setError("Expected winning collateral should be lower than remaining collateral.");
		} else if (error.length > 0) {
			setError("");
		}
	};

	const handleBid = async () => {
		try {
			setBidding(true);

			const bidWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2,
				chainId,
				abi: position.version === 1 ? MintingHubV1ABI : MintingHubV2ABI,
				functionName: "bid",
				args: [parseInt(challenge.number.toString()), amount, false],
			});

			const toastContent = [
				{
					title: `Bid Amount: `,
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: `Expected ZCHF: `,
					value: formatCurrency(formatUnits(expectedZCHF, 18)) + " ZCHF",
				},
				{
					title: "Transaction:",
					hash: bidWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: bidWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Placing a bid`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Placed Bid" rows={toastContent} />,
				},
			});

			track("auction_bid_placed", {
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
				label=""
				min={BigInt(position.minimumCollateral)}
				max={remainingSize}
				value={amount.toString()}
				onChange={onChangeAmount}
				digit={position.collateralDecimals}
				symbol={position.collateralSymbol}
				error={error}
				placeholder="Collateral Amount"
				limitLabel="Available"
				limitDigit={position.collateralDecimals}
				limit={remainingSize}
			/>

			<div className="flex flex-col gap-1.5 text-sm">
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Initially</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(challenge.size, position.collateralDecimals)} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Available</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(remainingSize, position.collateralDecimals)} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Challenger</span>
					<AppLink
						className=""
						label={shortenAddress(challenge.challenger)}
						href={ContractUrl(challenge.challenger, WAGMI_CHAIN)}
						external={true}
					/>
				</div>

				<div className="flex justify-between items-center mt-2">
					<span className="text-text-secondary">Price per unit</span>
					<span className="text-text-primary font-medium">
						{formatCurrency(formatUnits(auctionPrice, 36 - position.collateralDecimals), 2, 2)} ZCHF
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
					<span className="text-text-primary font-medium">{formatCurrency(formatUnits(expectedZCHF, 18), 2, 2)} ZCHF</span>
				</div>
			</div>

			<GuardSupportedChain chain={mainnet}>
				<AppButton
					disabled={amount == 0n || expectedZCHF > userBalance || error != ""}
					isLoading={isBidding}
					onClick={() => handleBid()}
				>
					Buy
				</AppButton>
			</GuardSupportedChain>
		</div>
	);
}
