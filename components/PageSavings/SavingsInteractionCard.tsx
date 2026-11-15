import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import AppToggle from "@components/AppToggle";
import TokenInputChain from "@components/Input/TokenInputChain";
import AddressInput from "@components/Input/AddressInput";
import { TabInput } from "@components/Input/TabInput";
import { SavingsChainAccount } from "@hooks";
import { ContractUrl, formatCurrency, shortenAddress } from "@utils";
import { Address, formatUnits, isAddress } from "viem";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SavingsActionSave from "./SavingsActionSave";
import SavingsActionWithdraw from "./SavingsActionWithdraw";
import SavingsActionInterest from "./SavingsActionInterest";
import SavingsActionSaveOnBehalf from "./SavingsActionSaveOnBehalf";

const TAB_DEPOSIT = "Deposit";
const TAB_WITHDRAW = "Withdraw";

interface Props {
	savings: SavingsChainAccount;
	hasAccount: boolean; // false while no wallet is connected, balances are unknown then
	readOnly: boolean; // viewing someone else's savings, all actions disabled
	isLoading: boolean;
	onChangeChain: (chainName: string) => void;
	onSuccess: () => void;
}

export default function SavingsInteractionCard({ savings, hasAccount, readOnly, isLoading, onChangeChain, onSuccess }: Props) {
	const router = useRouter();
	const { chain, module, walletBalance, saved, netInterest, withdrawable, ratePPM } = savings;

	const [tab, setTab] = useState<string>(TAB_DEPOSIT);
	const [amount, setAmount] = useState(0n);
	const [isMax, setMax] = useState(false);
	const [onbehalfToggle, setOnbehalfToggle] = useState(false);
	const [onbehalfAddress, setOnbehalfAddress] = useState("");
	const [newReferrer, setNewReferrer] = useState<Address | undefined>(undefined);
	const [newReferralFeePPM, setNewReferralFeePPM] = useState(0n);

	const isWithdraw = tab == TAB_WITHDRAW;
	const withdrawAll = isWithdraw && amount > 0n && (isMax || amount == withdrawable);

	const queryReferrer = router.query.referrer as string | undefined;
	const queryReferralFeePPM = router.query.referralFeePPM as string | undefined;

	useEffect(() => {
		if (queryReferrer && isAddress(queryReferrer)) setNewReferrer(queryReferrer);
		if (queryReferralFeePPM && /^\d+$/.test(queryReferralFeePPM) && BigInt(queryReferralFeePPM) > 0n) {
			setNewReferralFeePPM(BigInt(queryReferralFeePPM));
		}
	}, [queryReferrer, queryReferralFeePPM]);

	useEffect(() => {
		setAmount(0n);
		setMax(false);
	}, [tab, chain.id]);

	// keep "max" in sync with the growing interest, the transaction itself uses adjust(0) anyway
	useEffect(() => {
		if (isMax && isWithdraw) setAmount(withdrawable);
	}, [isMax, isWithdraw, withdrawable]);

	// ---------------------------------------------------------------------------

	const onChangeAmount = (value: string) => {
		setMax(false);
		setAmount(value == "" ? 0n : BigInt(value));
	};

	const onActionSuccess = () => {
		setAmount(0n);
		setMax(false);
		onSuccess();
	};

	const onbehalfError = onbehalfAddress == "" || isAddress(onbehalfAddress) ? "" : "Address is not valid.";

	const amountError = (): string => {
		if (isLoading || !hasAccount) return "";
		if (isWithdraw) {
			if (amount > withdrawable)
				return `You can withdraw at most ${formatCurrency(formatUnits(withdrawable, 18))} ZCHF on ${chain.name}.`;
		} else {
			if (amount > walletBalance) return "Not enough ZCHF in your wallet.";
			if (ratePPM == 0n && amount > 0n) return `The savings module on ${chain.name} is currently disabled.`;
		}
		return "";
	};
	const error = amountError();
	const disabled = readOnly || isLoading || amount == 0n || error != "";
	const reinvest = !isWithdraw && !onbehalfToggle && amount == 0n && netInterest > 0n;

	return (
		<AppCard>
			<TabInput tabs={[TAB_DEPOSIT, TAB_WITHDRAW]} tab={tab} setTab={setTab} />

			<TokenInputChain
				label={isWithdraw ? "You withdraw" : "You deposit"}
				chain={chain.name}
				symbol="ZCHF"
				tokenLogo="ZCHF"
				placeholder="ZCHF Amount"
				value={amount.toString()}
				onChange={onChangeAmount}
				onMax={() => setMax(isWithdraw)}
				max={!hasAccount ? undefined : isWithdraw ? withdrawable : walletBalance}
				limit={isWithdraw ? withdrawable : walletBalance}
				limitDigit={18}
				limitLabel={!hasAccount ? undefined : isWithdraw ? "Saved" : "Wallet"}
				onChangeChain={onChangeChain}
				error={error}
			/>

			{!isWithdraw ? (
				<div className="">
					{onbehalfToggle ? (
						<AddressInput
							label="To address"
							placeholder="0x1a2b3c..."
							error={onbehalfError}
							value={onbehalfAddress}
							onChange={setOnbehalfAddress}
						/>
					) : null}
					<AppToggle label="Save on behalf of another address" enabled={onbehalfToggle} onChange={setOnbehalfToggle} />
				</div>
			) : null}

			<div className="mx-auto my-4 w-full flex-col flex gap-4">
				{isWithdraw ? (
					<>
						<SavingsActionWithdraw
							savingsModule={module}
							amount={amount}
							withdrawAll={withdrawAll}
							disabled={disabled}
							onSuccess={onActionSuccess}
						/>
						{netInterest > 0n ? (
							<SavingsActionInterest
								savingsModule={module}
								saved={saved}
								interest={netInterest}
								disabled={readOnly || isLoading}
								onSuccess={onActionSuccess}
							/>
						) : null}
					</>
				) : onbehalfToggle ? (
					<SavingsActionSaveOnBehalf
						savingsModule={module}
						amount={amount}
						onBehalf={onbehalfAddress as Address}
						disabled={disabled || onbehalfError != "" || onbehalfAddress == ""}
						onSuccess={onActionSuccess}
					/>
				) : (
					<SavingsActionSave
						savingsModule={module}
						amount={amount}
						interest={netInterest}
						newReferrer={newReferrer}
						newReferralFeePPM={newReferralFeePPM}
						disabled={reinvest ? readOnly || isLoading : disabled}
						onSuccess={onActionSuccess}
					/>
				)}
				{!isWithdraw && !onbehalfToggle && amount > 0n && netInterest > 0n ? (
					<div className="-mt-2 text-sm text-text-secondary text-center">Also reinvests accrued interest</div>
				) : null}
			</div>

			{!isWithdraw && !onbehalfToggle && !reinvest && newReferrer ? (
				<div className="text-text-secondary text-sm mt-4">
					<span className="font-semibold">Notice: </span>
					You are about to set the referrer{" "}
					<AppLink className="" label={shortenAddress(newReferrer)} href={ContractUrl(newReferrer, chain)} external={true} /> who
					will receive <span className="font-semibold">{Number(newReferralFeePPM) / 10_000}%</span> of your earned interest on{" "}
					{chain.name}.
				</div>
			) : null}
		</AppCard>
	);
}
