import { useEffect, useState } from "react";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { formatCurrency, shortenAddress, TOKEN_SYMBOL } from "@utils";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { WAGMI_CONFIG } from "../../app.config";
import TokenLogo from "@components/TokenLogo";
import { AddCircleOutlineIcon } from "@components/SvgComponents/add_circle_outline";
import { SvgIconButton } from "@components/PageMint/PlusMinusButtons";
import { RemoveCircleOutlineIcon } from "@components/SvgComponents/remove_circle_outline";
import { NormalInputOutlined } from "@components/Input/NormalInputOutlined";
import Button from "@components/Button";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS, SavingsGatewayABI } from "@deuro/eurocoin";
import { useSavingsInterest } from "../../hooks/useSavingsInterest";
import { useTranslation } from "next-i18next";
import { useFrontendCode } from "../../hooks/useFrontendCode";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

export default function SavingsInteractionSection() {
	const { userSavingsBalance, refetchInterest } = useSavingsInterest();
	const [amount, setAmount] = useState("");
	const [isDeposit, setIsDeposit] = useState(true);
	const [isTxOnGoing, setIsTxOnGoing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const rate = useSelector((state: RootState) => state.savings.savingsInfo.rate);
	const { t } = useTranslation();
	const { frontendCode } = useFrontendCode();
	const account = useAccount();
	const chainId = useChainId();

	const dEuroAddress = ADDRESS[chainId].decentralizedEURO;
	const savingsGatewayAddress = ADDRESS[chainId].savingsGateway;
	const { balancesByAddress, refetchBalances } = useWalletERC20Balances([
		{
			address: dEuroAddress,
			symbol: TOKEN_SYMBOL,
			name: TOKEN_SYMBOL,
			allowance: [savingsGatewayAddress],
		},
	]);

	const deuroWalletDetails = balancesByAddress?.[dEuroAddress];
	const userBalance = deuroWalletDetails?.balanceOf || 0n;
	const userAllowance = deuroWalletDetails?.allowance?.[savingsGatewayAddress] || 0n;

	const handleApprove = async () => {
		try {
			setIsTxOnGoing(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: dEuroAddress,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].savingsGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDRESS[chainId].savingsGateway),
				},
				{
					title: t("common.txs.transaction"),
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("common.txs.title", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("common.txs.success", { symbol: TOKEN_SYMBOL })} rows={toastContent} />,
				},
			});
			refetchBalances();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setIsTxOnGoing(false);
		}
	};

	const showToastForWithdraw = async ({ hash }: { hash: `0x${string}` }) => {
		const toastContent = [
			{
				title: `${t("savings.txs.saved_amount")}`,
				value: `${formatCurrency(formatUnits(100n, 18))} ${TOKEN_SYMBOL}`,
			},
			{
				title: `${t("savings.txs.withdraw")}`,
				value: `${formatCurrency(formatUnits(100n, 18))} ${TOKEN_SYMBOL}`,
			},
			{
				title: `${t("common.txs.transaction")}`,
				hash: hash,
			},
		];

		await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: hash, confirmations: 1 }), {
			pending: {
				render: <TxToast title={t("savings.txs.withdrawing")} rows={toastContent} />,
			},
			success: {
				render: <TxToast title={t("savings.txs.successfully_withdrawn")} rows={toastContent} />,
			},
		});
	};

	const showToastForDeposit = async ({ hash }: { hash: `0x${string}` }) => {
		const toastContent = [
			{
				title: `${t("savings.txs.saving_amount")}`,
				value: `${formatCurrency(formatUnits(100n, 18))} ${TOKEN_SYMBOL}`,
			},
			{
				title: `${t("savings.txs.accured_interest")}`,
				value: `${formatCurrency(formatUnits(100n, 18))} ${TOKEN_SYMBOL}`,
			},
			{
				title: `${t("common.txs.transaction")}`,
				hash: hash,
			},
		];

		await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: hash, confirmations: 1 }), {
			pending: {
				render: <TxToast title={t("savings.txs.increasing_savings")} rows={toastContent} />,
			},
			success: {
				render: <TxToast title={t("savings.txs.successfully_increased_savings")} rows={toastContent} />,
			},
		});
	};

	const handleOnClick = async function () {
		if (!account.address) return;

		try {
			setIsTxOnGoing(true);

			const adjustedAmount = isDeposit ? BigInt(userSavingsBalance) + BigInt(amount) : BigInt(userSavingsBalance) - BigInt(amount);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "adjust",
				args: [adjustedAmount, frontendCode],
			});

			if (isDeposit) {
				showToastForDeposit({ hash: writeHash });
			} else {
				showToastForWithdraw({ hash: writeHash });
			}

			refetchInterest();
			refetchBalances();
			setAmount("");
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsTxOnGoing(false);
		}
	};

	// Deposit validation
	useEffect(() => {
		if (!isDeposit) return;

		if (!amount) {
			setError(null);
			return;
		}

		if (BigInt(amount) > userBalance) {
			setError(t("savings.error.insufficient_balance"));
		} else {
			setError(null);
		}
	}, [amount, isDeposit, userBalance]);

	// Withdraw validation
	useEffect(() => {
		if (isDeposit) return;

		if (!amount) {
			setError(null);
			return;
		}

		if (BigInt(amount) > userSavingsBalance) {
			setError(t("savings.error.greater_than_savings"));
		} else {
			setError(null);
		}
	}, [amount, isDeposit, userSavingsBalance]);

	return (
		<div className="flex flex-col gap-y-3">
			<div className="pb-1 flex flex-row justify-start items-center border-b border-b-borders-dividerLight">
				<span className="text-text-disabled font-medium text-base leading-tight">{t("savings.current_invest")}</span>
			</div>
			<div className="flex flex-row justify-between items-center">
				<div className="pl-3 flex flex-row gap-x-2 items-center">
					<TokenLogo currency={TOKEN_SYMBOL} />
					<div className="flex flex-col">
						<span className="text-base font-extrabold leading-tight">
							<span className="">{formatCurrency(formatUnits(userSavingsBalance, 18))}</span> {TOKEN_SYMBOL}
						</span>
						<span className="text-xs font-medium text-text-muted2 leading-[1rem]"></span>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row justify-end items-start sm:items-center">
					<SvgIconButton isSelected={isDeposit} onClick={() => setIsDeposit(true)} SvgComponent={AddCircleOutlineIcon}>
						{t("savings.deposit")}
					</SvgIconButton>
					<SvgIconButton isSelected={!isDeposit} onClick={() => setIsDeposit(false)} SvgComponent={RemoveCircleOutlineIcon}>
						{t("savings.withdraw")}
					</SvgIconButton>
				</div>
			</div>
			<div className="w-full">
				<NormalInputOutlined
					showTokenLogo={false}
					value={amount.toString()}
					onChange={setAmount}
					decimals={18}
					unit={TOKEN_SYMBOL}
					isError={!!error}
					adornamentRow={
						<div className="pl-2 text-xs leading-[1rem] flex flex-row gap-x-2">
							<span className="font-medium text-text-muted3">
								{t(isDeposit ? "savings.available_to_deposit" : "savings.available_to_withdraw")}:
							</span>
							<button
								className="text-text-labelButton font-extrabold"
								onClick={() => setAmount(isDeposit ? userBalance.toString() : userSavingsBalance.toString())}
							>
								{formatCurrency(formatUnits(isDeposit ? userBalance : userSavingsBalance, 18))} {TOKEN_SYMBOL}
							</button>
						</div>
					}
				/>
				{error && <div className="ml-1 text-text-warning text-sm">{error}</div>}
			</div>
			<div className="w-full mt-1.5 px-4 py-2 rounded-xl bg-[#E4F0FC] flex flex-row justify-between items-center text-base font-extrabold text-[#272B38]">
				<span>{t("savings.savings_rate")} (APR)</span>
				<span>{rate / 10_000}%</span>
			</div>
			<div className="w-full py-1.5">
				{userAllowance < BigInt(amount) ? (
					<Button className="text-lg leading-snug !font-extrabold" onClick={handleApprove} isLoading={isTxOnGoing}>
						{t("common.approve")}
					</Button>
				) : (
					<Button
						className="text-lg leading-snug !font-extrabold"
						onClick={handleOnClick}
						isLoading={isTxOnGoing}
						disabled={!!error || !Boolean(amount)}
					>
						{isDeposit
							? Boolean(amount)
								? t("savings.start_earning_interest", { rate: rate / 10_000 })
								: t("savings.enter_amount_to_add_savings")
							: !Boolean(amount)
								? t("savings.enter_withdraw_amount")
								: t("savings.withdraw_to_my_wallet")}
					</Button>
				)}
			</div>
		</div>
	);
}
