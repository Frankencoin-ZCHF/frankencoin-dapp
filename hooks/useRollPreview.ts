import { useEffect, useState } from "react";
import { readContracts } from "wagmi/actions";
import { erc20Abi } from "viem";
import { mainnet } from "viem/chains";
import { PositionQuery } from "@frankencoin/api";
import { PositionV2ABI } from "@frankencoin/zchf";
import { WAGMI_CONFIG } from "../app.config";
import { useLiveBlockNumber } from "./useLiveBlockNumber";

/** What PositionRoller.rollFully would do when rolling the source into the target, given the current state of both. */
export type RollPreview = {
	/** ZCHF it takes to repay the source in full */
	repay: bigint;
	/** amount minted in the target, including reserve and upfront interest */
	mint: bigint;
	/** collateral that moves from the source into the target */
	deposit: bigint;
	/** collateral of the source that the target does not need and that goes to the owner */
	collateralReturned: bigint;
	/** upfront interest charged on the mint */
	interest: bigint;
	/** part of the repayment that the mint does not pay for and that is taken from the wallet of the owner */
	fromWallet: bigint;
	/** live state of the target */
	targetPrice: bigint;
	targetMinted: bigint;
	targetCollateral: bigint;
};

/**
 * Follows the steps of PositionRoller.rollFully on the live state of the target, refreshed on every block.
 * The source is expected to be live already. Undefined until the first read completed.
 */
export function useRollPreview(source: PositionQuery, target: PositionQuery): RollPreview | undefined {
	const [preview, setPreview] = useState<RollPreview>();
	const { data: blockNumber } = useLiveBlockNumber({ watch: true });

	useEffect(() => {
		let stale = false;

		const fetcher = async function () {
			// rounded up, like the repayment the roller searches for
			const repay = (BigInt(source.minted) * BigInt(1_000_000 - source.reserveContribution) + 999_999n) / 1_000_000n;
			const collateral = BigInt(source.collateralBalance);

			const address = target.position;
			const chainId = mainnet.id;
			const abi = PositionV2ABI;
			const [mintForRepay, feePPM, targetPrice, targetMinted, targetCollateral] = await readContracts(WAGMI_CONFIG, {
				allowFailure: false,
				contracts: [
					{ address, chainId, abi, functionName: "getMintAmount", args: [repay] },
					{ address, chainId, abi, functionName: "calculateCurrentFee" },
					{ address, chainId, abi, functionName: "price" },
					{ address, chainId, abi, functionName: "minted" },
					{ address: target.collateral, chainId, abi: erc20Abi, functionName: "balanceOf", args: [address] },
				],
			});
			if (stale || targetPrice == 0n) return;

			// The roller mints what it takes to repay the source. If the collateral does not suffice for that at the
			// price of the target, it mints as much as possible and takes the rest of the repayment from the wallet.
			let mint = mintForRepay;
			let deposit = (mint * 10n ** 18n + targetPrice - 1n) / targetPrice;
			if (deposit > collateral) {
				deposit = collateral;
				mint = (deposit * targetPrice) / 10n ** 18n;
			}

			// a mint only pays out what is left after reserve and upfront interest
			const paidOut = (mint * (1_000_000n - BigInt(target.reserveContribution) - BigInt(feePPM))) / 1_000_000n;

			setPreview({
				repay,
				mint,
				deposit,
				collateralReturned: collateral - deposit,
				interest: (mint * BigInt(feePPM)) / 1_000_000n,
				fromWallet: paidOut < repay ? repay - paidOut : 0n,
				targetPrice,
				targetMinted,
				targetCollateral,
			});
		};

		fetcher();
		return () => {
			stale = true;
		};
	}, [
		blockNumber,
		source.minted,
		source.reserveContribution,
		source.collateralBalance,
		target.position,
		target.collateral,
		target.reserveContribution,
	]);

	return preview;
}
