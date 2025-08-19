import AppCard from "@components/AppCard";
import TokenInput from "@components/Input/TokenInput";
import { ADDRESS, DecentralizedEUROABI, SavingsGatewayABI } from "@deuro/eurocoin";
import { useContractUrl } from "@hooks";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { erc20Abi, maxUint256, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import SavingsDetailsCard from "./SavingsDetailsCard";
import { readContract, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import SavingsActionInterest from "./SavingsActionInterest";
import SavingsActionSave from "./SavingsActionSave";
import SavingsActionWithdraw from "./SavingsActionWithdraw";
import { TOKEN_SYMBOL } from "@utils";
import { useWalletERC20Balances } from "../../hooks/useWalletBalances";
import Button from "@components/Button";
import { useTranslation } from "next-i18next";
import { shortenAddress } from "@utils";
import { toast } from "react-toastify";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { waitForTransactionReceipt } from "wagmi/actions";

export default function SavingsInteractionCard() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isLoaded, setLoaded] = useState<boolean>(false);

	const [userBalance, setUserBalance] = useState(0n);
	const [userSavingsBalance, setUserSavingsBalance] = useState(0n);
	const [userSavingsTicks, setUserSavingsTicks] = useState(0n);
	const [userSavingsInterest, setUserSavingsInterest] = useState(0n);
	const [userSavingsLocktime, setUserSavingsLocktime] = useState(0n);
	const [currentTicks, setCurrentTicks] = useState(0n);
	const [isApproving, setIsApproving] = useState(false);

	const leadrate = useSelector((state: RootState) => state.savings.savingsInfo.rate);

	const { data } = useBlockNumber({ watch: true });
	const { t } = useTranslation();
	const { address } = useAccount();
	const chainId = useChainId();
	const url = useContractUrl(ADDRESS[chainId].savingsGateway);
	const account = address || zeroAddress;
	const ADDR = ADDRESS[chainId];

	const fromSymbol = TOKEN_SYMBOL;
	const change: bigint = amount - (userSavingsBalance + userSavingsInterest);
	const direction: boolean = amount >= userSavingsBalance + userSavingsInterest;
	const claimable: boolean = userSavingsInterest > 0n;

	const { balances, refetchBalances } = useWalletERC20Balances([
		{
			symbol: TOKEN_SYMBOL,
			name: TOKEN_SYMBOL,
			address: ADDR.decentralizedEURO,
			allowance: [ADDR.savingsGateway],
		},
	]);
	const allowance =
		balances.find((b) => b.address.toLowerCase() === ADDR.decentralizedEURO.toLowerCase())?.allowance?.[ADDR.savingsGateway] || 0n;
	// ---------------------------------------------------------------------------

	useEffect(() => {
		if (account === zeroAddress) return;

		const fetchAsync = async function () {
			const _balance = await readContract(WAGMI_CONFIG, {
				address: ADDR.decentralizedEURO,
				abi: DecentralizedEUROABI,
				functionName: "balanceOf",
				args: [account],
			});
			setUserBalance(_balance);

			const [_userSavings, _userTicks] = await readContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "savings",
				args: [account],
			});
			setUserSavingsBalance(_userSavings);
			setUserSavingsTicks(_userTicks);

			const _current = await readContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "currentTicks",
			});
			setCurrentTicks(_current);

			const _locktime = _userTicks >= _current && leadrate > 0 ? (_userTicks - _current) / BigInt(leadrate) : 0n;
			setUserSavingsLocktime(_locktime);

			const _tickDiff = _current - _userTicks;
			const _interest = _userTicks == 0n || _locktime > 0 ? 0n : (_tickDiff * _userSavings) / (1_000_000n * 365n * 24n * 60n * 60n);

			setUserSavingsInterest(_interest);

			if (!isLoaded) {
				setAmount(_userSavings);
				setLoaded(true);
			}
		};

		fetchAsync();
	}, [data, account, ADDR, isLoaded, leadrate]);

	useEffect(() => {
		setLoaded(false);
	}, [account]);

	// ---------------------------------------------------------------------------

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > userBalance + userSavingsBalance + userSavingsInterest) {
			setError(t('common.error.insufficient_balance', { symbol: fromSymbol }));
		} else {
			setError("");
		}
	};

	const handleApprove = async () => {
		try {
			setIsApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDR.decentralizedEURO,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDR.savingsGateway, maxUint256],
			});

			const toastContent = [
				{
					title: t("common.txs.amount"),
					value: "infinite " + TOKEN_SYMBOL,
				},
				{
					title: t("common.txs.spender"),
					value: shortenAddress(ADDR.savingsGateway),
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
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			setIsApproving(false);
			refetchBalances();
		}
	};


	return (
		<section className="grid grid-cols-1 md:grid-cols-2 gap-4 container mx-auto">
			<AppCard>
				<div className="text-lg font-bold text-center">{t("savings.adjustment")}</div>

				<div className="mt-8">
					<TokenInput
						label={t("savings.savings_balance")}
						max={userBalance + userSavingsBalance + userSavingsInterest}
						balanceLabel={t("common.max")}
						symbol={fromSymbol}
						placeholder={t("common.symbol_amount", { symbol: fromSymbol })}
						value={amount.toString()}
						onChange={onChangeAmount}
						error={error}
					/>
				</div>

				<div className="mx-auto my-4 w-72 max-w-full flex-col flex gap-4">
					<GuardToAllowedChainBtn label={direction ? t("savings.save") : t("savings.withdraw")}>
						{allowance <= 0n ? (
							<Button className="h-10" onClick={handleApprove} disabled={isApproving} isLoading={isApproving}>
								{t("common.approve")}
							</Button>
						) : userSavingsInterest > 0 && amount == userSavingsBalance ? (
							<SavingsActionInterest disabled={!!error} balance={userSavingsBalance} interest={userSavingsInterest} />
						) : amount > userSavingsBalance ? (
							<SavingsActionSave disabled={!!error} amount={amount} interest={userSavingsInterest} />
						) : (
							<SavingsActionWithdraw disabled={userSavingsBalance == 0n || !!error} balance={amount} change={change} />
						)}
					</GuardToAllowedChainBtn>
				</div>
			</AppCard>

			<SavingsDetailsCard
				balance={userSavingsBalance}
				change={isLoaded ? change : 0n}
				direction={direction}
				interest={isLoaded ? userSavingsInterest : 0n}
			/>
		</section>
	);
}
