import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatUnits, maxUint256, erc20Abi, Address } from "viem";
import Head from "next/head";
import TokenInput from "@components/Input/TokenInput";
import { abs, formatBigInt, formatCurrency, shortenAddress, TOKEN_SYMBOL } from "@utils";
import Button from "@components/Button";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { PositionQuery } from "@deuro/api";
import { ADDRESS, PositionV2ABI } from "@deuro/eurocoin";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function PositionAdjust() {
	const { t } = useTranslation();
	const [isApproving, setApproving] = useState(false);
	const [isAdjusting, setAdjusting] = useState(false);

	const [challengeSize, setChallengeSize] = useState(0n);

	const [userCollAllowance, setUserCollAllowance] = useState(0n);
	const [userCollBalance, setUserCollBalance] = useState(0n);
	const [userFrankBalance, setUserFrankBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useAccount();
	const router = useRouter();

	const chainId = useChainId();
	const addressQuery: Address = router.query.address as Address;

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const position = positions.find((p) => p.position == addressQuery) as PositionQuery;
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const [amount, setAmount] = useState<bigint>(BigInt(position.principal || 0n));
	const [collateralAmount, setCollateralAmount] = useState<bigint>(BigInt(position.collateralBalance));
	const [liqPrice, setLiqPrice] = useState<bigint>(BigInt(position?.price ?? 0n));

	// ---------------------------------------------------------------------------
	useEffect(() => {
		const acc: Address | undefined = account.address;
		const fc: Address = ADDRESS[WAGMI_CHAIN.id].decentralizedEURO;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			if (acc !== undefined) {
				const _balanceFrank = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[WAGMI_CHAIN.id].decentralizedEURO,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserFrankBalance(_balanceFrank);

				const _balanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [acc],
				});
				setUserCollBalance(_balanceColl);

				const _allowanceColl = await readContract(WAGMI_CONFIG, {
					address: position.collateral,
					abi: erc20Abi,
					functionName: "allowance",
					args: [acc, position.position],
				});
				setUserCollAllowance(_allowanceColl);
			}

			const _balanceChallenge = await readContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV2ABI,
				functionName: "challengedAmount",
			});
			setChallengeSize(_balanceChallenge);
		};

		fetchAsync();
	}, [data, account.address, position]);

	// ---------------------------------------------------------------------------
	if (!position) return null;

	const isCooldown: boolean = position.cooldown * 1000 - Date.now() > 0;

	const maxMintableForCollateralAmount: bigint = BigInt(formatUnits(BigInt(position.price) * collateralAmount, 36 - 18).split(".")[0]);
	const maxMintableInclClones: bigint = BigInt(position.availableForClones) + BigInt(position.principal);
	const maxTotalLimit: bigint =
		maxMintableForCollateralAmount <= maxMintableInclClones ? maxMintableForCollateralAmount : maxMintableInclClones;

	const calcDirection = amount > BigInt(position.principal);
	const feeDuration = BigInt(Math.floor(position.expiration * 1000 - Date.now())) / 1000n;
	const feePercent = (feeDuration * BigInt(position.annualInterestPPM)) / BigInt(60 * 60 * 24 * 365);
	const fees = calcDirection ? (feePercent * amount) / 1_000_000n : 0n;

	// ---------------------------------------------------------------------------
	const paidOutAmount = () => {
		if (amount > BigInt(position.principal)) {
			return (
				((amount - BigInt(position.principal)) * (1_000_000n - BigInt(position.reserveContribution) - BigInt(feePercent))) / 1_000_000n
			);
		} else {
			return amount - BigInt(position.principal) - returnFromReserve();
		}
	};

	const returnFromReserve = () => {
		return (BigInt(position.reserveContribution) * (amount - BigInt(position.principal))) / 1_000_000n;
	};

	const collateralNote =
		collateralAmount < BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } ${t("my_positions.sent_back_to_your_wallet")}`
			: collateralAmount > BigInt(position.collateralBalance)
			? `${formatUnits(abs(collateralAmount - BigInt(position.collateralBalance)), position.collateralDecimals)} ${
					position.collateralSymbol
			  } ${t("my_positions.taken_from_your_wallet")}`
			: "";

	const onChangeAmount = (value: string) => {
		setAmount(BigInt(value));
	};

	const onChangeCollAmount = (value: string) => {
		setCollateralAmount(BigInt(value));
	};

	function getCollateralError() {
		if (collateralAmount - BigInt(position.collateralBalance) > userCollBalance) {
			return `${t("common.error.insufficient_balance", { symbol: position.collateralSymbol })}`;
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return `${t("my_positions.not_enough_collateral")}`;
		}
	}

	function getAmountError() {
		if (isCooldown) {
			return position.cooldown > 1e30 ? t("my_positions.is_closed") : t("my_positions.is_in_cooldown");
		} else if (amount - BigInt(position.principal) > maxTotalLimit) {
			return `${t("my_positions.position_limited", { amount: formatCurrency(formatUnits(maxTotalLimit, 18), 2, 2), symbol: TOKEN_SYMBOL })}`;
		} else if (-paidOutAmount() > userFrankBalance) {
			return `${t("common.error.insufficient_balance", { symbol: TOKEN_SYMBOL })}`;
		} else if (liqPrice * collateralAmount < amount * 10n ** 18n) {
			return `${t("my_positions.can_mint_at_most", { amount: formatUnits((collateralAmount * liqPrice) / 10n ** 36n, 0), symbol: TOKEN_SYMBOL })}`;
		} else if (BigInt(position.price) * collateralAmount < amount * 10n ** 18n) {
			return `${t("my_positions.only_after_cooldown")}`;
		} else {
			return "";
		}
	}

	const onChangeLiqAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setLiqPrice(valueBigInt);
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.position, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + position.collateralSymbol,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(position.position),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${t("common.txs.title", { symbol: position.collateralSymbol })}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`${t("common.txs.success", { symbol: position.collateralSymbol })}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: needs to be translated
		} finally {
			setApproving(false);
		}
	};

	const handleAdjust = async () => {
		try {
			setAdjusting(true);
			const adjustWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.position,
				abi: PositionV2ABI,
				functionName: "adjust",
				args: [amount, collateralAmount, liqPrice],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: formatBigInt(amount),
				},
				{
					title: t("my_positions.txs.collateral_amount"),
					value: formatBigInt(collateralAmount, position.collateralDecimals),
				},
				{
					title: t("my_positions.txs.liquidation_price"),
					value: formatBigInt(liqPrice, 36 - position.collateralDecimals),
				},
				{
					title: t("common.txs.transaction"),
					hash: adjustWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: adjustWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`${t("my_positions.txs.adjusting_position")}`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`${t("my_positions.txs.successfully_adjusted_position")}`} rows={toastContent} />,
				},
			});
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: needs to be translated
		} finally {
			setAdjusting(false);
		}
	};

	return (
		<>
			<Head>
				<title>dEURO - {t("my_positions.manage_position")}</title>
			</Head>

			<div className="md:mt-8">
				<span className="font-bold text-xl">
					{t("my_positions.manage_position_at", { address: shortenAddress(position.position) })}
				</span>
			</div>

			<div className="md:mt-8">
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center">
							{t("my_positions.adjustment")}
						</div>
						<div className="space-y-8">
							<TokenInput
								label={t("common.amount")}
								symbol={TOKEN_SYMBOL}
								output={position.closed ? "0" : ""}
								balanceLabel="Max:"
								max={maxTotalLimit}
								digit={18}
								value={amount.toString()}
								onChange={onChangeAmount}
								error={getAmountError()}
								placeholder={t("my_positions.loan_amount")}
							/>
							<TokenInput
								label={t("common.collateral")}
								balanceLabel="Max:"
								symbol={position.collateralSymbol}
								max={userCollBalance + BigInt(position.collateralBalance)}
								value={collateralAmount.toString()}
								onChange={onChangeCollAmount}
								digit={position.collateralDecimals}
								note={collateralNote}
								error={getCollateralError()}
								placeholder={t("common.collateral_amount")}
							/>
							<TokenInput
								label={t("common.liquidation_price")}
								balanceLabel={t("common.current_value")}
								symbol={TOKEN_SYMBOL}
								max={BigInt(position.price)}
								value={liqPrice.toString()}
								digit={36 - position.collateralDecimals}
								onChange={onChangeLiqAmount}
								placeholder={t("common.liquidation_price")}
							/>
							<div className="mx-auto mt-8 w-72 max-w-full flex-col">
								<GuardToAllowedChainBtn>
									{collateralAmount - BigInt(position.collateralBalance) > userCollAllowance ? (
										<Button isLoading={isApproving} onClick={() => handleApprove()}>
											{t("my_positions.txs.approving_collateral")}
										</Button>
									) : (
										<Button
											disabled={
												(amount == BigInt(position.principal) &&
													collateralAmount == BigInt(position.collateralBalance) &&
													liqPrice == BigInt(position.price)) ||
												(!position.denied &&
													((isCooldown && amount > 0n) || !!getAmountError() || !!getCollateralError())) ||
												(challengeSize > 0n && collateralAmount < BigInt(position.collateralBalance))
											}
											error={position.owner != account.address ? t("my_positions.only_adjust_your_own_position") : ""}
											isLoading={isAdjusting}
											onClick={() => handleAdjust()}
										>
											{t("my_positions.txs.adjusting_position")}
										</Button>
									)}
								</GuardToAllowedChainBtn>
							</div>
						</div>
					</div>
					<div>
						<div className="bg-card-body-primary shadow-card rounded-xl p-4 flex flex-col">
							<div className="text-lg font-bold text-center mt-3">
								{t("my_positions.outcome")}
							</div>
							<div className="flex-1 mt-4">
								<div className="flex">
									<div className="flex-1"></div>
									<div className="text-right">
										<span className="text-xs mr-3"></span>
									</div>
								</div>

								<div className="flex">
									<div className="flex-1">
										<span>{t("my_positions.current_minted_amount")}</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(BigInt(position.principal), 18))} {TOKEN_SYMBOL}
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										{amount >= BigInt(position.principal) ? t("my_positions.sent_to_your_wallet") : t("my_positions.to_be_added_from_your_wallet")}
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(paidOutAmount(), 18))} {TOKEN_SYMBOL}
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										{amount >= BigInt(position.principal) ? t("my_positions.added_to_reserve_on_your_behalf") : t("my_positions.returned_from_reserve")}
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">{formatCurrency(0)}%</span> */}
										{formatCurrency(formatUnits(returnFromReserve(), 18))} {TOKEN_SYMBOL}
									</div>
								</div>

								<div className="mt-2 flex">
									<div className="flex-1">
										<span>{t("my_positions.upfront_interest")}</span>
										<div className="text-xs">({position.annualInterestPPM / 10000}% per year)</div>
									</div>
									<div className="text-right">
										{formatCurrency(formatUnits(fees, 18))} {TOKEN_SYMBOL}
									</div>
								</div>

								<hr className="mt-4 border-slate-700 border-dashed" />

								<div className="mt-2 flex font-bold">
									<div className="flex-1">
										<span>{t("my_positions.future_minted_amount")}</span>
									</div>
									<div className="text-right">
										{/* <span className="text-xs mr-3">100%</span> */}
										<span>{formatCurrency(formatUnits(amount, 18))} {TOKEN_SYMBOL}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}


export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}