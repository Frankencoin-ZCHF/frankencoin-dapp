import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { HeaderCell, LinkTitle, NoDataRow } from "./SectionTable";
import { SavingsGatewayABI, ADDRESS } from "@deuro/eurocoin";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useBlockNumber, useChainId, useAccount } from "wagmi";
import { useRouter } from "next/router";
import { zeroAddress, formatUnits } from "viem";
import { SecondaryButton } from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { formatCurrency, TOKEN_SYMBOL } from "@utils";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import { WAGMI_CONFIG } from "../../app.config";
import { getPublicViewAddress } from "../../utils/url";
import { renderErrorTxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import { useFrontendCode } from "../../hooks/useFrontendCode";
const SavingsRow = ({ balance, interest, change }: { balance: bigint; interest: bigint; change: bigint }) => {
	return (
		<>
			<div className="pr-3 flex items-center">
				<TokenLogo currency="dEURO" size={8} />
			</div>
			<span className="flex items-center text-text-primary text-base font-extrabold">{formatCurrency(formatUnits(balance, 18))}</span>
			<span className="flex items-center text-text-primary text-base font-medium">{formatCurrency(formatUnits(change, 18))}</span>
			<span className="flex items-center text-text-primary text-base font-medium">{formatCurrency(formatUnits(interest, 18))}</span>
		</>
	);
};

export const MySavings = () => {
	const { t } = useTranslation();
	const [amount, setAmount] = useState(0n);
	const [isLoaded, setLoaded] = useState<boolean>(false);
	const [userSavingsBalance, setUserSavingsBalance] = useState(0n);
	const [userSavingsInterest, setUserSavingsInterest] = useState(0n);
	const [interestToBeCollected, setInterestToBeCollected] = useState(0n);
	const [isAction, setAction] = useState<boolean>(false);
	const leadrate = useSelector((state: RootState) => state.savings.savingsInfo.rate);
	const claims = useSelector((state: RootState) => state.savings.savingsUserTable.interest);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const chainId = useChainId();
	const router = useRouter();
	const overwrite = getPublicViewAddress(router);
	const account = overwrite || address || zeroAddress;
	const ADDR = ADDRESS[chainId];

	const { frontendCode } = useFrontendCode();

	const change: bigint = claims.reduce((acc, claim) => acc + BigInt(claim.amount), 0n);

	useEffect(() => {
		if (account === zeroAddress || isAction) return;

		const fetchAsync = async function () {
			const [_userSavings, _userTicks] = await readContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "savings",
				args: [account as `0x${string}`],
			});
			setUserSavingsBalance(_userSavings);

			const _current = await readContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "currentTicks",
			});

			const accruedInterest = await readContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "accruedInterest",
				args: [account as `0x${string}`],
			});
			setInterestToBeCollected(accruedInterest);

			const _locktime = _userTicks >= _current && leadrate > 0n ? (_userTicks - _current) / BigInt(leadrate) : 0n;
			const _tickDiff = _current - _userTicks;
			const _interest = _userTicks == 0n || _locktime > 0 ? 0n : (_tickDiff * _userSavings) / (1_000_000n * 365n * 24n * 60n * 60n);

			setUserSavingsInterest(_interest);

			if (!isLoaded) {
				setAmount(_userSavings);
				setLoaded(true);
			}
		};

		fetchAsync();
	}, [data, account, ADDR, isLoaded, leadrate, isAction]);

	useEffect(() => {
		setLoaded(false);
	}, [account]);

	const claimInterest = async function () {
		if (!address) return;

		try {
			setAction(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDR.savingsGateway,
				abi: SavingsGatewayABI,
				functionName: "adjust",
				args: [userSavingsBalance, frontendCode],
			});

			const toastContent = [
				{
					title: `Saved amount: `,
					value: `${formatCurrency(formatUnits(amount, 18))} ${TOKEN_SYMBOL}`,
				},
				{
					title: `Claim Interest: `,
					value: `${formatCurrency(formatUnits(interestToBeCollected, 18))} ${TOKEN_SYMBOL}`,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Claiming Interest...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully claimed" rows={toastContent} />,
				},
			});
			setUserSavingsInterest(0n);
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setAction(false);
		}
	};

	const savingsData = userSavingsBalance > 0n || userSavingsInterest > 0n || change > 0n;

	return (
		<div className="w-full h-full p-4 sm:p-8 flex flex-col items-start">
			<LinkTitle href={"/savings"}>{t("dashboard.my_savings")}</LinkTitle>
			<div className="w-full flex flex-row justify-between items-center">
				<div className="w-full grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_auto] gap-y-1">
					<span className="w-11 pr-3"></span>
					<HeaderCell>{t("dashboard.current_investment")}</HeaderCell>
					<HeaderCell>{t("dashboard.total_earned")}</HeaderCell>
					<HeaderCell>{t("dashboard.interest_to_be_collected")}</HeaderCell>
					{savingsData ? (
						<SavingsRow balance={userSavingsBalance} interest={userSavingsInterest} change={change} />
					) : (
						<NoDataRow className="col-span-3">{t("dashboard.no_savings_yet")}</NoDataRow>
					)}
				</div>
			</div>
			{savingsData && (
				<div className="w-full flex-1 pt-10 flex items-end">
					<SecondaryButton className="w-full py-2.5 px-4" disabled={userSavingsInterest === 0n || !address} isLoading={isAction} onClick={claimInterest}>{t("dashboard.collect_interest")}</SecondaryButton>
				</div>
			)}
		</div>
	);
};
