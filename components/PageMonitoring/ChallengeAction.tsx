import { useEffect, useState } from "react";
import { PositionQuery } from "@frankencoin/api";
import { erc20Abi, Address, formatUnits } from "viem";
import TokenInput from "@components/Input/TokenInput";
import AppButton from "@components/AppButton";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { TxToast, renderErrorTxToast } from "@components/TxToast";
import { formatBigInt, formatCurrency, normalizeAddress, shortenAddress } from "@utils";
import { useConnection, useBlockNumber } from "wagmi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, MintingHubV1ABI, MintingHubV2ABI } from "@frankencoin/zchf";
import { toast } from "react-toastify";
import { track } from "@hooks";
import { mainnet } from "viem/chains";

interface Props {
	position: PositionQuery;
	onChallengeSuccess: () => void;
}

export default function ChallengeAction({ position, onChallengeSuccess }: Props) {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isInit, setInit] = useState(false);
	const [isApproving, setApproving] = useState(false);
	const [isChallenging, setChallenging] = useState(false);
	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const account = useConnection();
	const chainId = mainnet.id;
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const marketPriceChf = prices[normalizeAddress(position.collateral)]?.price?.chf;

	// ---------------------------------------------------------------------------
	useEffect(() => {
		const acc: Address | undefined = account.address;
		if (acc === undefined) return;
		if (!position || !position.collateral) return;

		const fetchAsync = async function () {
			const _balanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [acc],
			});
			setUserBalance(_balanceColl);

			const _allowanceColl = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				chainId,
				abi: erc20Abi,
				functionName: "allowance",
				args: [acc, position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2],
			});
			setUserAllowance(_allowanceColl);
		};

		fetchAsync();
	}, [data, account.address, position, chainId]);

	useEffect(() => {
		if (isInit || position == undefined) return;
		setAmount(BigInt(position.collateralBalance));
		setInit(true);
	}, [isInit, position]);

	// ---------------------------------------------------------------------------
	const _collBal: bigint = BigInt(position.collateralBalance);
	const belowMinBalance: boolean = _collBal < BigInt(position.minimumCollateral);

	// ---------------------------------------------------------------------------
	const onChangeAmount = (value: string) => {
		let valueBigInt = BigInt(value);
		if (valueBigInt > _collBal && !belowMinBalance) {
			valueBigInt = _collBal;
		}
		setAmount(valueBigInt);
		if (valueBigInt > userBalance) {
			setError(`Not enough ${position.collateralSymbol} in your wallet.`);
		} else if (valueBigInt > BigInt(position.collateralBalance) && !belowMinBalance) {
			setError("Amount cannot be larger than the underlying position");
		} else if (valueBigInt < BigInt(position.minimumCollateral) && !belowMinBalance) {
			setError("Amount must be at least the minimum");
		} else {
			setError("");
		}
	};

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.collateral as Address,
				chainId,
				abi: erc20Abi,
				functionName: "approve",
				args: [position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
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

			track("collateral_approved", { collateral: position.collateralSymbol });
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setApproving(false);
		}
	};

	const handleChallenge = async () => {
		try {
			setChallenging(true);

			const challengeWriteHash = await writeContract(WAGMI_CONFIG, {
				address: position.version === 1 ? ADDRESS[chainId].mintingHubV1 : ADDRESS[chainId].mintingHubV2,
				chainId,
				abi: position.version === 1 ? MintingHubV1ABI : MintingHubV2ABI,
				functionName: "challenge",
				args: [position.position, amount, BigInt(position.price)],
			});

			const toastContent = [
				{
					title: "Size:",
					value: formatBigInt(amount, position.collateralDecimals) + " " + position.collateralSymbol,
				},
				{
					title: "Price: ",
					value: formatBigInt(BigInt(position.price), 36 - position.collateralDecimals) + " ZCHF",
				},
				{
					title: "Transaction:",
					hash: challengeWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: challengeWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Launching a challenge`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={`Successfully Launched challenge`} rows={toastContent} />,
				},
			});

			track("position_challenged", {
				collateral: position.collateralSymbol,
				amount: formatBigInt(amount, position.collateralDecimals),
			});
			onChallengeSuccess();
		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setChallenging(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<TokenInput
				symbol={position.collateralSymbol}
				min={BigInt(position.minimumCollateral)}
				max={userBalance > BigInt(position.collateralBalance) ? BigInt(position.collateralBalance) : userBalance}
				balanceLabel="Your balance:"
				digit={position.collateralDecimals}
				value={amount.toString()}
				onChange={onChangeAmount}
				error={error}
				label="Amount"
				placeholder="Collateral Amount"
				limit={userBalance > BigInt(position.collateralBalance) ? BigInt(position.collateralBalance) : userBalance}
				limitDigit={position.collateralDecimals}
				limitLabel="Maximum"
			/>

			<div className="flex flex-col gap-1.5 text-sm">
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Starting price</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(BigInt(position.price), 36 - position.collateralDecimals)} ZCHF
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Potential reward (2%)</span>
					<span className="text-text-primary font-medium">
						{formatCurrency(formatUnits((BigInt(position.price) * amount * 2n) / 100n, 36), 2, 2)} ZCHF
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Collateral in position</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(BigInt(position.collateralBalance), position.collateralDecimals)} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Minimum amount</span>
					<span className="text-text-primary font-medium">
						{formatBigInt(BigInt(position.minimumCollateral), position.collateralDecimals)} {position.collateralSymbol}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-text-secondary">Phase duration</span>
					<span className="text-text-primary font-medium">{Math.round(position.challengePeriod / 3600)} h</span>
				</div>
			</div>

			<GuardSupportedChain chain={mainnet}>
				{amount > userAllowance ? (
					<AppButton isLoading={isApproving} disabled={!!error} onClick={() => handleApprove()}>
						Approve
					</AppButton>
				) : (
					<AppButton isLoading={isChallenging} disabled={!!error || amount == 0n} onClick={() => handleChallenge()}>
						Challenge
					</AppButton>
				)}
			</GuardSupportedChain>
		</div>
	);
}
