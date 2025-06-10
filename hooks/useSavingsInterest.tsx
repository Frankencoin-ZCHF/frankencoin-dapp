import { useAccount, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useBlockNumber } from "wagmi";
import { ADDRESS, SavingsGatewayABI } from "@deuro/eurocoin";
import { formatCurrency, getPublicViewAddress, TOKEN_SYMBOL } from "@utils";
import { formatUnits, zeroAddress } from "viem";
import { toast } from "react-toastify";
import { RootState } from "../redux/redux.store";
import { useFrontendCode } from "./useFrontendCode";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../app.config";
import { renderErrorTxToast, TxToast } from "@components/TxToast";
import { gql, useQuery } from "@apollo/client";

export const useSavingsInterest = () => {
	const [amount, setAmount] = useState(0n);
	const [isLoaded, setLoaded] = useState<boolean>(false);
	const [userSavingsBalance, setUserSavingsBalance] = useState(0n);
	const [userSavingsInterest, setUserSavingsInterest] = useState(0n);
	const [interestToBeCollected, setInterestToBeCollected] = useState(0n);
	const [isClaiming, setIsClaiming] = useState<boolean>(false);
	const [isReinvesting, setIsReinvesting] = useState<boolean>(false);
	const leadrate = useSelector((state: RootState) => state.savings.savingsInfo.rate);
	const [refetchSignal, setRefetchSignal] = useState(0);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const chainId = useChainId();
	const router = useRouter();
	const overwrite = getPublicViewAddress(router);
	const account = overwrite || address || zeroAddress;
	const ADDR = ADDRESS[chainId];

	const { frontendCode } = useFrontendCode();

	const { data: leaderboardData, refetch: refetchLeaderboard } = useQuery(
		gql`
			{
				savingsUserLeaderboard(id: "${account}") {
					interestReceived
				}
			}
		`,
		{
			pollInterval: 0,
			skip: !account || account === zeroAddress,
		}
	);
	const change = BigInt(leaderboardData?.savingsUserLeaderboard?.interestReceived || 0n);

	useEffect(() => {
		if (account === zeroAddress || isClaiming) return;

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
	}, [data, account, ADDR, isLoaded, leadrate, isClaiming, refetchSignal]);

	useEffect(() => {
		setLoaded(false);
	}, [account]);

	const refetchInterest = async () => {
		setRefetchSignal((prev) => prev + 1);
		refetchLeaderboard();
	};

	const claimInterest = async () => {
		if (!address) return;

		try {
			setIsClaiming(true);

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

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 2 }), {
				pending: {
					render: <TxToast title={`Claiming Interest...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully claimed" rows={toastContent} />,
				},
			});

			setUserSavingsInterest(0n);
			refetchInterest();
			refetchLeaderboard();
		} catch (error) {
			toast.error(renderErrorTxToast(error)); // TODO: add error translation
		} finally {
			if (setLoaded != undefined) setLoaded(false);
			setIsClaiming(false);
		}
	};

	const handleReinvest = async () => {
		if (!address) return;

		try {
			setIsReinvesting(true);

		const reinvestHash = await writeContract(WAGMI_CONFIG, {
			address: ADDRESS[chainId].savingsGateway,
			abi: SavingsGatewayABI,
			functionName: "save",
			args: [BigInt(0), frontendCode],
		});

		const toastContent = [
			{
				title: `Reinvested amount: `,
				value: `${formatCurrency(formatUnits(interestToBeCollected, 18))} ${TOKEN_SYMBOL}`,
			},
			{
				title: "Transaction: ",
				hash: reinvestHash,
			},
		];

		await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: reinvestHash, confirmations: 2 }), {
			pending: {
				render: <TxToast title={`Reinvesting...`} rows={toastContent} />,
			},
			success: {
				render: <TxToast title="Successfully reinvested" rows={toastContent} />,
			},
		});

		} catch (error) {
			toast.error(renderErrorTxToast(error));
		} finally {
			setIsReinvesting(false);
		}
	};

	const hasSavingsData = userSavingsBalance > 0n || userSavingsInterest > 0n || change > 0n;

	return {
		isClaiming,
		isReinvesting,
		hasSavingsData,
		interestToBeCollected,
		totalEarnedInterest: change,
		userSavingsBalance,
		claimInterest,
		refetchInterest,
		handleReinvest,
	};
};
