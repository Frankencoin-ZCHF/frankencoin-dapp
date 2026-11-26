import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery } from "@frankencoin/api";
import { formatCurrency, formatDateTime, FormatType, normalizeAddress, shortenAddress } from "../../utils/format";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, ERC20ABI } from "@frankencoin/zchf";
import { useConnection } from "wagmi";
import PositionRollerDialog from "./PositionRollerDialog";
import AppButton from "@components/AppButton";
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";
import { useUserBalance, useLiveBlockNumber, useRollPreview } from "@hooks";

interface Props {
	headers: string[];
	tab: string;
	source: PositionQuery;
	target: PositionQuery;
	challengeSize: bigint;
	// whether the roller finds a repayment that brings the minted amount of the source to exactly zero
	isRepayable: boolean;
	// if not, the repayment that fixes this, or zero if there is no such simple fix
	prepareAmount: bigint;
}

export default function PositionRollerRow({ headers, tab, source, target, challengeSize, isRepayable, prepareAmount }: Props) {
	const [userCollAllowance, setUserCollAllowance] = useState<bigint>(0n);
	const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
	const { data } = useLiveBlockNumber({ watch: true });
	const { address } = useConnection();
	const account = address || zeroAddress;
	const userBalance = useUserBalance(account);
	const preview = useRollPreview(source, target);

	useEffect(() => {
		if (account == zeroAddress) return;

		const fetcher = async function () {
			const allowance = await readContract(WAGMI_CONFIG, {
				address: target.collateral,
				chainId: mainnet.id,
				abi: ERC20ABI,
				functionName: "allowance",
				args: [account, ADDRESS[mainnet.id].rollerV2],
			});

			setUserCollAllowance(allowance);
		};

		fetcher();
	}, [data, account, target.collateral]);

	const isCooldown = target.cooldown * 1000 > Date.now();
	const isSourceCooldown = source.cooldown * 1000 > Date.now();

	const isTargetOwned = normalizeAddress(target.owner) === normalizeAddress(source.owner);
	const action = isTargetOwned ? "Merging" : "Rolling";
	// without a wallet, the dialog asks to connect one
	const isForeignWallet = account != zeroAddress && normalizeAddress(account) !== normalizeAddress(source.owner);

	// the roller cannot repay the source as it is, but can after a tiny repayment
	const needsPrepare = !isRepayable && prepareAmount > 0n;

	// A clone must start with the minimum collateral of the target, but the roller only moves what the loan needs
	// at the price of the target. Merging adds to a position that already holds its minimum.
	const minimumCollateral = BigInt(target.minimumCollateral);
	const isBelowMinimum = !isTargetOwned && !!preview && preview.deposit < minimumCollateral;
	const formatCollateral = (value: bigint) =>
		new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(formatUnits(value, target.collateralDecimals)));

	// Why the action is not possible at all, shown below the row. The roller withdraws the collateral from the source and
	// mints in the target, so it is subject to the restrictions of both. Everything the user can resolve as part of the
	// process, like missing funds or an approval, is left to the dialog.
	function getBlocker(): string | undefined {
		if (isForeignWallet) {
			return `Only the owner of this position can ${isTargetOwned ? "merge" : "roll"} it.`;
		} else if (challengeSize > 0n) {
			return `${action} is not possible while your position is being challenged.`;
		} else if (isSourceCooldown) {
			return `${action} is not possible during the cooldown of your position, which ends ${formatDateTime(source.cooldown)}.`;
		} else if (!isRepayable && !needsPrepare) {
			// amounts with only a few decimals can always be repaid exactly
			const rounded = (BigInt(source.minted) / 10n ** 16n) * 10n ** 16n;
			return `${action} would fail due to rounding, as no repayment settles the outstanding amount of your position to the last digit. Reduce it slightly with the adjustment above first, for example to ${formatCurrency(
				formatUnits(rounded, 18),
				2,
				2,
				FormatType.us
			)} ZCHF.`;
		} else if (isCooldown) {
			return `The target position is in a cooldown, which ends ${formatDateTime(target.cooldown)}.`;
		} else if (isBelowMinimum && preview) {
			return `Rolling is not possible, as the new position would only hold the ${formatCollateral(preview.deposit)} ${
				target.collateralSymbol
			} needed to back your loan, less than its minimum of ${formatCollateral(minimumCollateral)} ${target.collateralSymbol}.`;
		}
	}

	const blocker = getBlocker();

	const dateArr: string[] = new Date(target.expiration * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow
			headers={headers}
			rawHeader={true}
			tab={tab}
			footer={blocker ? <div className="text-sm text-text-warning md:text-right">{blocker}</div> : undefined}
			actionCol={
				<>
					<AppButton className="h-10" disabled={!!blocker} onClick={() => setDialogOpen(true)}>
						{isTargetOwned ? "Merge" : "Roll"}
					</AppButton>
					{isDialogOpen && (
						<PositionRollerDialog
							source={source}
							target={target}
							preview={preview}
							allowance={userCollAllowance}
							walletBalance={userBalance[mainnet.id].frankencoin}
							prepareAmount={needsPrepare ? prepareAmount : 0n}
							blocker={blocker}
							onClose={() => setDialogOpen(false)}
						/>
					)}
				</>
			}
		>
			{/* target */}
			<AppLink
				className="text-left"
				label={shortenAddress(target.position)}
				href={`/monitoring/${target.position}`}
				external={false}
			/>

			{/* Liquidation */}
			<div className="flex flex-col">
				{formatCurrency(formatUnits(preview?.targetPrice ?? BigInt(target.price), 36 - target.collateralDecimals), 2, 2)} ZCHF
			</div>

			{/* Interest */}
			<div className="flex flex-col">{formatCurrency(target.annualInterestPPM / 10_000, 2, 2)}%</div>

			{/* Maturity */}
			<div className="flex flex-col">{dateStr}</div>
		</TableRow>
	);
}
