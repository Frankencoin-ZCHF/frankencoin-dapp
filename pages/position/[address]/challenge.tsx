import Head from "next/head";
import { useRouter } from "next/router";
import AppBox from "@components/AppBox";
import AppPageHeader from "@components/AppPageHeader";
import Button from "@components/Button";
import DisplayAmount from "@components/DisplayAmount";
import TokenInput from "@components/Input/TokenInput";
import { usePositionStats, useTokenPrice, useZchfPrice } from "@hooks";
import { getAddress, zeroAddress } from "viem";
import { useState } from "react";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { erc20ABI, useAccount, useChainId, useContractWrite } from "wagmi";
import { waitForTransaction } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import { toast } from "react-toastify";
import { TxToast, renderErrorToast } from "@components/TxToast";
import DisplayLabel from "@components/DisplayLabel";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";

export default function PositionChallenge() {
	const router = useRouter();
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);
	const { address: positionAddr } = router.query;

	const chainId = useChainId();
	const { address } = useAccount();
	const account = address || zeroAddress;
	const position = getAddress(String(positionAddr || zeroAddress));
	const positionStats = usePositionStats(position);
	const collateralPrice = useTokenPrice(positionStats.collateral);
	const zchfPrice = useZchfPrice();

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > positionStats.collateralUserBal) {
			setError(`Not enough ${positionStats.collateralSymbol} in your wallet.`);
		} else if (valueBigInt > positionStats.collateralBal) {
			setError("Challenge collateral should be lower than position collateral");
		} else if (valueBigInt < positionStats.minimumCollateral) {
			setError("Challenge collateral should be greater than minimum collateral");
		} else {
			setError("");
		}
	};

	const approveWrite = useContractWrite({
		address: positionStats.collateral,
		abi: erc20ABI,
		functionName: "approve",
		args: [ADDRESS[chainId].mintingHub, amount],
	});
	const challengeWrite = useContractWrite({
		address: ADDRESS[chainId].mintingHub,
		abi: ABIS.MintingHubABI,
		functionName: "challenge",
	});

	const handleApprove = async () => {
		const tx = await approveWrite.writeAsync();

		const toastContent = [
			{
				title: "Amount:",
				value: formatBigInt(amount, positionStats.collateralDecimal) + " " + positionStats.collateralSymbol,
			},
			{
				title: "Spender: ",
				value: shortenAddress(ADDRESS[chainId].mintingHub),
			},
			{
				title: "Transaction:",
				hash: tx.hash,
			},
		];

		await toast.promise(waitForTransaction({ hash: tx.hash, confirmations: 1 }), {
			pending: {
				render: <TxToast title={`Approving ${positionStats.collateralSymbol}`} rows={toastContent} />,
			},
			success: {
				render: <TxToast title={`Successfully Approved ${positionStats.collateralSymbol}`} rows={toastContent} />,
			},
			error: {
				render(error: any) {
					return renderErrorToast(error);
				},
			},
		});
	};

	const handleChallenge = async () => {
		const tx = await challengeWrite.writeAsync({
			args: [position, amount, positionStats.liqPrice],
		});

		const toastContent = [
			{
				title: "Size:",
				value: formatBigInt(amount, positionStats.collateralDecimal) + " " + positionStats.collateralSymbol,
			},
			{
				title: "Price: ",
				value: formatBigInt(positionStats.liqPrice, 36 - positionStats.collateralDecimal),
			},
			{
				title: "Transaction:",
				hash: tx.hash,
			},
		];

		await toast.promise(waitForTransaction({ hash: tx.hash, confirmations: 1 }), {
			pending: {
				render: <TxToast title={`Launching a challenge`} rows={toastContent} />,
			},
			success: {
				render: <TxToast title={`Successfully Launched challenge`} rows={toastContent} />,
			},
			error: {
				render(error: any) {
					return renderErrorToast(error);
				},
			},
		});
	};

	return (
		<>
			<Head>
				<title>Frankencoin - Position Challenge</title>
			</Head>
			<div>
				<AppPageHeader title="Launch Challenge" backText="Back to position" backTo={`/position/${position}`} />
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
						<div className="text-lg font-bold text-center mt-3">Challenge Details</div>
						<TokenInput
							symbol={positionStats.collateralSymbol}
							max={positionStats.collateralUserBal}
							digit={positionStats.collateralDecimal}
							value={amount.toString()}
							onChange={onChangeAmount}
							error={error}
							label="Amount"
							placeholder="Collateral Amount"
						/>
						<div className="bg-slate-900 rounded-xl p-4 grid grid-cols-6 gap-2 lg:col-span-2">
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Starting Price" />
								<DisplayAmount
									amount={positionStats.liqPrice}
									currency={"ZCHF"}
									digits={36 - positionStats.collateralDecimal}
									address={ADDRESS[chainId].frankenCoin}
									usdPrice={zchfPrice}
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Maximum Proceeds" />
								<DisplayAmount
									amount={positionStats.liqPrice * amount}
									currency={"ZCHF"}
									digits={36 - positionStats.collateralDecimal + 18}
									address={ADDRESS[chainId].frankenCoin}
									usdPrice={zchfPrice}
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Collateral in Position" />
								<DisplayAmount
									amount={positionStats.collateralBal}
									currency={positionStats.collateralSymbol}
									digits={positionStats.collateralDecimal}
									address={positionStats.collateral}
									usdPrice={collateralPrice}
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Minimum Amount" />
								<DisplayAmount
									amount={positionStats.minimumCollateral}
									currency={positionStats.collateralSymbol}
									digits={positionStats.collateralDecimal}
									address={positionStats.collateral}
									usdPrice={collateralPrice}
								/>
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Fixed Price Phase" />
								{formatDuration(positionStats.challengePeriod)}
							</AppBox>
							<AppBox className="col-span-6 sm:col-span-3">
								<DisplayLabel label="Declining Price Phase" />
								{formatDuration(positionStats.challengePeriod)}
							</AppBox>
						</div>
						<div>
							<GuardToAllowedChainBtn>
								{amount > positionStats.collateralAllowance ? (
									<Button
										isLoading={approveWrite.isLoading || isConfirming}
										disabled={!!error || account == positionStats.owner}
										onClick={() => handleApprove()}
									>
										Approve
									</Button>
								) : (
									<Button
										variant="primary"
										isLoading={challengeWrite.isLoading || isConfirming}
										disabled={!!error || account == positionStats.owner}
										onClick={() => handleChallenge()}
									>
										Challenge
									</Button>
								)}
							</GuardToAllowedChainBtn>
						</div>
					</div>
					<div className="bg-slate-950 rounded-xl p-4 flex flex-col">
						<div className="text-lg font-bold text-center mt-3">How does it work?</div>
						<AppBox className="flex-1 mt-4">
							<p>
								The amount of the collateral asset you provide will be publicly auctioned in a Dutch auction. The auction
								has two phases, a fixed price phase and a declining price phase.
							</p>
							<ol className="flex flex-col gap-y-2 pl-6 [&>li]:list-decimal">
								<li>
									During the fixed price phase, anyone can buy the {positionStats.collateralSymbol} you provided at the
									liquidation price. If everything gets sold before the phase ends, the challenge is averted and you have
									effectively sold the provided {positionStats.collateralSymbol} to the bidders for{" "}
									{formatBigInt(positionStats.liqPrice, 36 - positionStats.collateralDecimal)} ZCHF per unit.
								</li>
								<li>
									If the challenge is not averted, the fixed price phase is followed by a declining price phase during
									which the price at which the
									{positionStats.collateralSymbol} tokens can be obtained declines linearly towards zero. In this case,
									the challenge is considered successful and you get the provided {positionStats.collateralSymbol} tokens
									back. The tokens sold in this phase do not come from the challenger, but from the position owner. The
									total amount of tokens that can be bought from the position is limited by the amount left in the
									challenge at the end of the fixed price phase. As a reward for starting a successful challenge, you get
									2% of the sales proceeds.
								</li>
							</ol>
						</AppBox>
					</div>
				</section>
			</div>
		</>
	);
}
