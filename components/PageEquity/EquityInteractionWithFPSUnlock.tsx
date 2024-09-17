import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useAccount, useBlockNumber, useChainId, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import TokenInput from "@components/Input/TokenInput";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";

export default function EquityInteractionWithWFPSRedeem() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const [fpsAllowance, setFpsAllowance] = useState<bigint>(0n);
	const [fpsBalance, setFpsBalance] = useState<bigint>(0n);
	const [wfpsHolding, setWfpsHolding] = useState<bigint>(0n);
	const [calculateProceeds, setCalculateProceeds] = useState<bigint>(0n);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const poolStats = usePoolStats();
	const chainId = useChainId();
	const account = address || zeroAddress;

	useEffect(() => {
		const fpsUnlock = ADDRESS[chainId].fpsUnlock;
		const fetchAsync = async function () {
			if (account != zeroAddress) {
				if (fpsUnlock) {
					const _fpsAllowance = await readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].equity,
						abi: erc20Abi,
						functionName: "allowance",
						args: [account, fpsUnlock],
					});
					setFpsAllowance(_fpsAllowance);
				}

				const _fpsBalance = await readContract(WAGMI_CONFIG, {
					address: ADDRESS[chainId].equity,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [account],
				});
				setFpsBalance(_fpsBalance);
			}

			const _wfpsHolding = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: ABIS.EquityABI,
				functionName: "holdingDuration",
				args: [ADDRESS[chainId].wFPS],
			});
			setWfpsHolding(_wfpsHolding);
		};

		fetchAsync();
	}, [data, account, chainId]);

	useEffect(() => {
		const fetchAsync = async function () {
			const _calculateProceeds = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: ABIS.EquityABI,
				functionName: "calculateProceeds",
				args: [amount],
			});
			setCalculateProceeds(_calculateProceeds);
		};

		fetchAsync();
	}, [chainId, amount]);

	const handleApprove = async () => {
		const fpsUnlock = ADDRESS[chainId].fpsUnlock;
		if (!fpsUnlock) return;

		try {
			setApproving(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: erc20Abi,
				functionName: "approve",
				args: [fpsUnlock, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FPS",
				},
				{
					title: "Spender: ",
					value: shortenAddress(fpsUnlock),
				},
				{
					title: "Transaction:",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving FPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved FPS" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setApproving(false);
		}
	};

	const handleRedeem = async () => {
		const fpsUnlock = ADDRESS[chainId].fpsUnlock;
		if (!fpsUnlock) return;

		try {
			setRedeeming(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: fpsUnlock,
				abi: ABIS.FPSUnlock,
				functionName: "unlockAndRedeem",
				args: [amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " FPS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(calculateProceeds) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Unlock and Redeeming FPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed FPS" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setRedeeming(false);
		}
	};

	const fromSymbol = "FPS";
	const toSymbol = "ZCHF";
	const unlocked = wfpsHolding > 86_400 * 90 && wfpsHolding < 86_400 * 365 * 30;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fpsBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	const conversionNote = () => {
		if (amount != 0n && calculateProceeds != 0n) {
			const ratio = (calculateProceeds * BigInt(1e18)) / amount;
			return `1 ${fromSymbol} = ${formatUnits(ratio, 18)} ${toSymbol}`;
		} else {
			return `${toSymbol} price is calculated dynamically.\n`;
		}
	};

	return (
		<>
			<div className="mt-2 px-1">
				You can unlock and redeem your FPS tokens, in one step, for ZCHF once the 90-day holding period of the WFPS token contract
				has elapsed.
			</div>
			<div className="mt-8">
				<TokenInput
					max={fpsBalance}
					symbol={fromSymbol}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={fromSymbol + " Amount"}
				/>
				<div className="py-4 text-center z-0">
					<button
						className={`btn btn-secondary z-0 text-slate-800 w-14 h-14 rounded-full transition ${direction && "rotate-180"}`}
						onClick={() => {}}
					>
						<FontAwesomeIcon icon={faArrowRightArrowLeft} className="rotate-90 w-6 h-6" />
					</button>
				</div>
				<TokenInput symbol={toSymbol} hideMaxLabel output={formatUnits(calculateProceeds, 18)} label="Receive" />
				<div className={`mt-2 px-1 transition-opacity`}>{conversionNote()}</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn>
						{amount > fpsAllowance ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleApprove()}>
								Approve
							</Button>
						) : (
							<Button
								variant="primary"
								isLoading={isRedeeming}
								disabled={amount == 0n || !!error || !unlocked}
								onClick={() => handleRedeem()}
							>
								Unlock and Redeem
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={fpsBalance} currency="FPS" address={ADDRESS[chainId].equity} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Current Price" />
					<DisplayAmount
						amount={(poolStats.equityPrice * fpsBalance) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration WFPS Contract" />
					<span className={!unlocked ? "text-red-500 font-bold" : ""}>
						{wfpsHolding > 0 && wfpsHolding < 86_400 * 365 * 30 ? formatDuration(wfpsHolding) : "-"}
					</span>
				</AppBox>
				{/* <AppBox className="flex-1">
					<DisplayLabel label="Can redeem after" />
					{formatDuration(redeemLeft)}
				</AppBox> */}
			</div>
		</>
	);
}
