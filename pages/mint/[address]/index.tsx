import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { formatUnits, maxUint256, erc20Abi, Hash, zeroHash, parseEther, decodeEventLog, parseUnits } from "viem";
import TokenInput from "@components/Input/TokenInput";
import { useState } from "react";
import Button from "@components/Button";
import ButtonSecondary from "@components/ButtonSecondary";
import { useAccount, useBlockNumber } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { Address } from "viem";
import { formatBigInt, formatCurrency, formatDateFromSecs, min, shortenAddress, toTimestamp } from "@utils";
import { toast } from "react-toastify";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import DateInput from "@components/Input/DateInput";
import { WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { ADDRESS, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
import AppLink from "@components/AppLink";
import { useRouter as useNavigation } from "next/navigation";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import AppCard from "@components/AppCard";
import AppTitle from "@components/AppTitle";
import LiquidationSlider from "@components/Input/LiquidationSlider";
import { useBorrowPositions } from "../../../hooks/useBorrowPositions";

export default function PositionBorrow({}) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [errorDate, setErrorDate] = useState("");
	const [isInit, setInit] = useState<boolean>(false);
	const [isApproving, setApproving] = useState(false);
	const [isCloning, setCloning] = useState(false);
	const [expirationDate, setExpirationDate] = useState<Date>(new Date(0));
	const [expirationTab, setExpirationTab] = useState<string>("Max");

	const [collAmount, setCollAmount] = useState(0n);
	const [liqPrice, setLiqPrice] = useState(0);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const navigate = useNavigation();
	const account = useAccount();
	const router = useRouter();

	const chainId = mainnet.id;
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery);
	const { bestPriceByCollateral, bestInterestByCollateral, bestExpirationByCollateral, bestAvailabilityByCollateral } =
		useBorrowPositions();
	const originalPosition = position?.isClone ? positions.find((p) => p.position === position.original) : position;
	const originalExpiration = originalPosition?.expiration ?? position?.expiration;

	const prices = useSelector((state: RootState) => state.prices.coingecko);

	// ---------------------------------------------------------------------------
	useEffect(() => {
		if (isInit) return;
		if (!position || position.expiration == 0) return;
		setExpirationDate(toDate(originalExpiration ?? position.expiration));

		if (!amount) {
			const initColl = BigInt(position.minimumCollateral);
			const initPrice = parseFloat(formatUnits(BigInt(position.price), 36 - position.collateralDecimals));
			const initMintAmount: bigint = (BigInt(position.price) * initColl) / parseUnits("1", 18);
			setCollAmount(initColl);
			setLiqPrice(initPrice);
			setAmount(initMintAmount);
		}

		setInit(true);
	}, [position, amount, expirationDate, isInit, originalExpiration]);

	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balance);

			const _allowance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2],
			});
			setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account.address, position, chainId]);

	// ---------------------------------------------------------------------------
	// dont continue if position not loaded correctly
	if (!position) return null;

	const price: number = parseFloat(formatUnits(BigInt(position.price), 36 - position.collateralDecimals));
	const collateralPriceZchf: number = prices[position.collateral.toLowerCase() as Address].price.chf || 1;
	const interest: number = position.annualInterestPPM / 10 ** 6;
	const reserve: number = position.reserveContribution / 10 ** 6;
	const effectiveLTV: number = (price * (1 - reserve)) / collateralPriceZchf;
	const effectiveInterest: number = interest / (1 - reserve);

	const requiredColl = collAmount > BigInt(position.minimumCollateral) ? collAmount : BigInt(position.minimumCollateral);
	const expirationMax = toDate(originalExpiration ?? position.expiration);
	const _now = new Date();
	const expirationTabDates: Record<string, Date> = {
		"1M": new Date(_now.getFullYear(), _now.getMonth() + 1, _now.getDate()),
		"3M": new Date(_now.getFullYear(), _now.getMonth() + 3, _now.getDate()),
		"6M": new Date(_now.getFullYear(), _now.getMonth() + 6, _now.getDate()),
		"1Y": new Date(_now.getFullYear() + 1, _now.getMonth(), _now.getDate()),
		Max: expirationMax,
	};
	const errorColl =
		collAmount < BigInt(position.minimumCollateral)
			? `Minimum ${formatCurrency(formatUnits(BigInt(position.minimumCollateral), position.collateralDecimals))} ${
					position.collateralSymbol
			  } required`
			: account.address && collAmount > userBalance
			? `Not enough ${position.collateralSymbol} in your wallet.`
			: "";

	const borrowersReserveContribution = (BigInt(position.reserveContribution) * amount) / 1_000_000n;

	function toDate(time: bigint | number | string) {
		const v: bigint = BigInt(time);
		return new Date(Number(v) * 1000);
	}

	// max(4 weeks, ((chosen expiration) - (current block))) * position.annualInterestPPM() / (365 days) / 1000000
	const feePercent =
		(BigInt(Math.max(60 * 60 * 24 * 30, Math.floor((expirationDate.getTime() - Date.now()) / 1000))) *
			BigInt(position.annualInterestPPM)) /
		BigInt(60 * 60 * 24 * 365);
	const availableAmount = BigInt(position.availableForClones);
	const fees = (feePercent * amount) / 1_000_000n;
	const paidOutToWallet = amount - borrowersReserveContribution - fees;
	const maxPaidOut =
		availableAmount -
		(BigInt(position.reserveContribution) * availableAmount) / 1_000_000n -
		(feePercent * availableAmount) / 1_000_000n;
	const paidOutToWalletPct = (parseInt(paidOutToWallet.toString()) * 100) / parseInt(amount.toString());
	const userValue = (userBalance * BigInt(position.price)) / BigInt(1e18);
	const borrowingLimit = min(availableAmount, userValue);

	const errorReceive =
		amount > availableAmount ? `No more than ${formatCurrency(formatUnits(availableAmount, 18))} ZCHF can be borrowed in total` : "";

	const onMaxReceive = () => {
		const collNeeded = BigInt(Math.ceil((parseFloat(formatUnits(availableAmount, 18)) / liqPrice) * 10 ** position.collateralDecimals));
		setCollAmount(collNeeded);
		setAmount(availableAmount);
	};

	const onChangeCollateral = (value: string) => {
		const collBigInt = BigInt(value);
		setCollAmount(collBigInt);
		const newAmount = BigInt(Math.floor(parseFloat(formatUnits(collBigInt, position.collateralDecimals)) * liqPrice * 1e18));
		setAmount(newAmount);
	};

	const onChangeLiqPrice = (newPrice: number) => {
		setLiqPrice(newPrice);
		const newAmount = BigInt(Math.floor(parseFloat(formatUnits(requiredColl, position.collateralDecimals)) * newPrice * 1e18));
		setAmount(newAmount);
	};

	const onChangeExpiration = (value: Date | null) => {
		if (!value) value = new Date();
		const newTimestamp = toTimestamp(value);
		const bottomLimit = toTimestamp(new Date());
		const uppperLimit = originalExpiration ?? position.expiration;

		if (newTimestamp < bottomLimit || newTimestamp > uppperLimit) {
			setErrorDate("Expiration Date should be between Now and Limit");
		} else {
			setErrorDate("");
		}
		setExpirationDate(value);
	};

	const onMaxExpiration = () => {
		setExpirationDate(expirationMax);
	};

	const onTabExpiration = (t: string) => {
		const date = expirationTabDates[t] ?? expirationMax;
		setExpirationTab(t);
		onChangeExpiration(date);
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.version == 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2, maxUint256],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].mintingHubV1),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving ${position.collateralSymbol}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Approved ${position.collateralSymbol}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleClone = async () => {
		try {
			setCloning(true);
			const expirationTime = toTimestamp(expirationDate);
			let cloneWriteHash: Hash = zeroHash;

			if (position.version == 1) {
				cloneWriteHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].mintingHubV1,
					chainId,
					abi: MintingHubV1ABI,
					functionName: "clone",
					args: [position.position, requiredColl, amount, BigInt(expirationTime)],
				});
			} else if (position.version == 2) {
				cloneWriteHash = await writeContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].mintingHubV2,
					chainId,
					abi: MintingHubV2ABI,
					functionName: "clone",
					args: [position.position, requiredColl, amount, expirationTime],
				});
			}

			const toastContent = [
				{
					title: `Amount: `,
					value: formatBigInt(amount) + " ZCHF",
				},
				{
					title: `Collateral: `,
					value: formatBigInt(requiredColl, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Transaction:",
					hash: cloneWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: cloneWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Minting ZCHF`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Minted ZCHF" rows={toastContent} />,
				},
			});

			const receipt = await waitForTransactionReceipt(WAGMI_CONFIG, {
				chainId,
				hash: cloneWriteHash,
				confirmations: 1,
			});

			const targetEvents = receipt.logs
				.map((log) => {
					try {
						// Try to decode each log using your ABI
						return decodeEventLog({
							abi: position.version == 1 ? MintingHubV1ABI : MintingHubV2ABI,
							data: log.data,
							topics: log.topics,
						});
					} catch (error) {
						// If decoding fails, it's not an event from your contract
						return null;
					}
				})
				.filter((event) => event !== null && event.eventName === "PositionOpened");

			if (targetEvents.length > 0) {
				const position = targetEvents[0].args.position;
				navigate.push(`/mypositions/${position}`);
			}
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setCloning(false);
		}
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Borrow</title>
			</Head>

			<AppTitle title={position.collateralName} symbol={position.collateralSymbol} />

			<div className="mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<AppCard>
						<div className="text-lg font-bold text-center mt-3">Borrow Fresh Frankencoins</div>
						<div className="grid md:grid-cols-2 gap-4">
							<TokenInput
								label="Deposit"
								max={userBalance}
								digit={position.collateralDecimals}
								onChange={onChangeCollateral}
								error={errorColl}
								placeholder="Amount"
								value={String(collAmount)}
								symbol={position.collateralSymbol}
								limit={userBalance}
								limitDigit={position.collateralDecimals}
								limitLabel="Balance"
							/>
							<TokenInput
								label="Receive"
								symbol="ZCHF"
								value={paidOutToWallet.toString()}
								output={String(formatCurrency(formatUnits(paidOutToWallet, 18)))}
								max={maxPaidOut}
								onMax={onMaxReceive}
								error={errorReceive}
								disabled={true}
								showButtons={true}
								limit={maxPaidOut}
								limitDigit={18}
								limitLabel="Available"
							/>
						</div>

						<LiquidationSlider
							label="Liquidation Price"
							value={liqPrice}
							min={collateralPriceZchf * 0.1}
							max={price}
							marketPrice={collateralPriceZchf}
							onChange={onChangeLiqPrice}
							limit={BigInt(position.price)}
							limitDigit={36 - position.collateralDecimals}
							limitLabel="Max"
						/>

						<DateInput
							label="Repay by"
							value={expirationDate}
							onChange={onChangeExpiration}
							error={errorDate}
							max={expirationMax}
							tabs={["1M", "3M", "6M", "1Y", "Max"]}
							tabDates={expirationTabDates}
							tab={expirationTab}
							onTab={onTabExpiration}
						/>

						<div className="flex-1 mb-4">
							<div className="flex">
								<div className="flex-1 text-text-secondary">
									<span>Total borrow</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(amount, 18))} ZCHF</span>
								</div>
							</div>

							<div className="mt-2 flex">
								<div className="flex-1 text-text-secondary">
									<span>Retained reserve</span>
									<span className="text-xs ml-1">({formatCurrency(position.reserveContribution / 10000)}%)</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(borrowersReserveContribution, 18))} ZCHF</span>
								</div>
							</div>

							<div className="mt-2 flex">
								<div className="flex-1 text-text-secondary">
									<span>Upfront interest</span>
									<span className="text-xs ml-1">({position.annualInterestPPM / 10000}%)</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(fees, 18))} ZCHF</span>
								</div>
							</div>

							<div className="mt-4 flex font-extrabold">
								<div className="flex-1 text-text-secondary">
									<span>Sent to your wallet</span>
								</div>
								<div className="text-right">
									<span>{formatCurrency(formatUnits(paidOutToWallet, 18))} ZCHF</span>
								</div>
							</div>
						</div>

						<div className="mx-auto w-full flex-col">
							<GuardSupportedChain chain={mainnet}>
								{requiredColl > userAllowance ? (
									<Button
										disabled={requiredColl > userBalance || !!errorColl}
										isLoading={isApproving}
										onClick={() => handleApprove()}
									>
										Approve
									</Button>
								) : (
									<Button
										disabled={requiredColl > userBalance || !!error}
										isLoading={isCloning}
										onClick={() => handleClone()}
									>
										Borrow
									</Button>
								)}
							</GuardSupportedChain>
						</div>
					</AppCard>

					<div className="grid gap-4">
						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Position Details</div>
							<div className="flex-1">
								<div className="flex">
									<div className="flex-1 text-text-secondary">Available to Borrow</div>
									<div className="">{formatCurrency(formatUnits(availableAmount, 18))} ZCHF</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">Market Price</div>
									<div className="">{formatCurrency(collateralPriceZchf)} ZCHF</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">Liquidation Price</div>
									<div className="">
										{formatCurrency(formatUnits(BigInt(position.price), 36 - position.collateralDecimals))} ZCHF
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1 text-text-secondary">Loan-To-Value</div>
									<div className="">{formatCurrency(effectiveLTV * 100)}%</div>
								</div>

								<div className="mt-2 pb-2 flex">
									<div className="flex-1 text-text-secondary">Effective Annual Interest</div>
									<div className="">{formatCurrency(effectiveInterest * 100)}%</div>
								</div>

								{position.isClone && (
									<div className="mt-2 flex">
										<div className="flex-1 text-text-secondary">Parent Position</div>
										<AppLink
											className=""
											label={shortenAddress(position.version == 2 ? position.parent : position.original)}
											href={`/monitoring/${position.version == 2 ? position.parent : position.original}`}
										></AppLink>
									</div>
								)}

								{position.version == 2 && (
									<div className="mt-2 flex">
										<div className="flex-1 text-text-secondary">Original Position</div>
										<AppLink
											className=""
											label={shortenAddress(position.original)}
											href={`/monitoring/${position.original}`}
										></AppLink>
									</div>
								)}

								<p className="mt-4 text-text-secondary text-sm">
									While the maturity is fixed, you can adjust the liquidation price and the collateral amount later as
									long as it covers the minted amount. No interest will be refunded when repaying earlier.
								</p>
							</div>
						</AppCard>

						<AppCard>
							<div className="text-lg font-bold text-center mt-3">Alternative Terms</div>
							<div className="flex-1 mt-4">
								<div className="grid grid-cols-3 text-xs text-text-secondary pb-1 border-b border-gray-200 mb-1">
									<div>Term</div>
									<div className="text-center">Value</div>
									<div className="text-right">Best</div>
								</div>
								{(() => {
									const collKey = position.collateral.toLowerCase() as Address;
									const bestRatePos = bestInterestByCollateral[collKey];
									const bestRateValue = bestRatePos
										? `${formatCurrency(
												(bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution)) * 100
										  )}%`
										: "";
									const posEffectiveRate = position.annualInterestPPM / (1_000_000 - position.reserveContribution);
									const bestEffectiveRate = bestRatePos
										? bestRatePos.annualInterestPPM / (1_000_000 - bestRatePos.reserveContribution)
										: Infinity;
									const rows = [
										{
											label: "Best Price",
											pos: bestPriceByCollateral[collKey],
											value: `${formatCurrency(
												parseFloat(
													formatUnits(
														BigInt(bestPriceByCollateral[collKey]?.price ?? 0),
														36 - position.collateralDecimals
													)
												)
											)} ZCHF`,
											isBest: BigInt(position.price) >= BigInt(bestPriceByCollateral[collKey]?.price ?? 0),
										},
										{
											label: "Best Rate",
											pos: bestRatePos,
											value: bestRateValue,
											isBest: posEffectiveRate <= bestEffectiveRate,
										},
										{
											label: "Best Expiry",
											pos: bestExpirationByCollateral[collKey],
											value: formatDateFromSecs(bestExpirationByCollateral[collKey]?.expiration ?? 0),
											isBest: (originalExpiration ?? 0) >= (bestExpirationByCollateral[collKey]?.expiration ?? 0),
										},
										{
											label: "Best Availability",
											pos: bestAvailabilityByCollateral[collKey],
											value: `${formatCurrency(
												formatUnits(BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0), 18)
											)} ZCHF`,
											isBest:
												BigInt(position.availableForClones) >=
												BigInt(bestAvailabilityByCollateral[collKey]?.availableForClones ?? 0),
										},
									];
									return rows.map(({ label, pos, value, isBest }) => {
										if (!pos) return null;
										const isCurrent = isBest;
										return (
											<div
												key={label}
												className={`grid grid-cols-3 py-2 text-sm border-b border-gray-100 last:border-0 ${
													isCurrent ? "text-text-secondary" : "cursor-pointer"
												}`}
												onClick={() => !isCurrent && navigate.push(`/mint/${pos.position}`)}
											>
												<div className="text-text-secondary">{label}</div>
												<div className="text-center font-medium text-text-primary">{value}</div>
												<div className="text-right">
													{isCurrent ? (
														<span className="font-bold text-green-500">✓</span>
													) : (
														<span className="inline-block text-xs px-2 py-0.5 rounded-full bg-button-default hover:bg-button-hover text-white font-medium">
															Select
														</span>
													)}
												</div>
											</div>
										);
									});
								})()}
							</div>
							<div className="mt-2">
								<ButtonSecondary onClick={() => navigate.push(`/mint/create?source=${addressQuery}`)}>
									Need different terms?
								</ButtonSecondary>
							</div>
						</AppCard>
					</div>
				</section>
			</div>
		</>
	);
}
