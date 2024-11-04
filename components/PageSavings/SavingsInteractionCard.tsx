import AppCard from "@components/AppCard";
import TokenInput from "@components/Input/TokenInput";
import TokenInputSelect from "@components/Input/TokenInputSelect";
import { faArrowDown, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ADDRESS } from "@frankencoin/zchf";
import { useContractUrl } from "@hooks";
import Button from "@components/Button";
import Link from "next/link";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { Address, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";

export default function SavingsInteractionCard() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isApproving, setApproving] = useState(false);
	const [isInversting, setInversting] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const [allowanceFrankencoin, setAllowanceFrankencoin] = useState(0n);
	const [direction, setDirection] = useState<Boolean>(true);

	const [userAllowance, setUserAllowance] = useState(0n);
	const [userBalance, setUserBalance] = useState(0n);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const chainId = useChainId();
	const url = useContractUrl(ADDRESS[chainId].savings);
	const account = address || zeroAddress;

	const fromBalance: bigint = 12000n;
	const fromSymbol = "ZCHF";
	const toSymbol = "ZCHF";

	// ---------------------------------------------------------------------------

	useEffect(() => {
		if (account === zeroAddress) return;

		const fetchAsync = async function () {
			// const _balance = await readContract(WAGMI_CONFIG, {
			// 	address: position.collateral,
			// 	abi: erc20Abi,
			// 	functionName: "balanceOf",
			// 	args: [acc],
			// });
			// setUserBalance(_balance);
			// const _allowance = await readContract(WAGMI_CONFIG, {
			// 	address: position.collateral,
			// 	abi: erc20Abi,
			// 	functionName: "allowance",
			// 	args: [acc, position.version == 1 ? ADDRESS[WAGMI_CHAIN.id].mintingHubV1 : ADDRESS[WAGMI_CHAIN.id].mintingHubV2],
			// });
			// setUserAllowance(_allowance);
		};

		fetchAsync();
	}, [data, account]);

	// ---------------------------------------------------------------------------

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > fromBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	const handleDirectionToggle = () => {
		setDirection(!direction);
	};

	return (
		<AppCard>
			<Link href={url} target="_blank">
				<div className="mt-4 text-lg font-bold underline text-center">
					Savings Module
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
				</div>
			</Link>

			<div className="mt-8">
				<TokenInput
					label="Save"
					max={fromBalance}
					symbol={fromSymbol}
					placeholder={fromSymbol + " Amount"}
					value={amount.toString()}
					onChange={onChangeAmount}
				/>
			</div>

			<div className="mx-auto my-4 w-72 max-w-full flex-col">
				<GuardToAllowedChainBtn label={direction ? "Save" : "Withdraw"}>
					{direction ? (
						amount > allowanceFrankencoin ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error} onClick={() => {}}>
								Approve
							</Button>
						) : (
							<Button disabled={amount == 0n || !!error} isLoading={isInversting} onClick={() => {}}>
								Save
							</Button>
						)
					) : (
						<Button isLoading={isRedeeming} disabled={amount == 0n || !!error} onClick={() => {}}>
							Withdraw
						</Button>
					)}
				</GuardToAllowedChainBtn>
			</div>
		</AppCard>
	);
}
