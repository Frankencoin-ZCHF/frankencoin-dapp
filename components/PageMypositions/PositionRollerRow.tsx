import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery } from "@frankencoin/api";
import { formatCurrency, FormatType, shortenAddress } from "../../utils/format";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, ERC20ABI } from "@frankencoin/zchf";
import { useAccount, useBlockNumber } from "wagmi";
import PositionRollerApproveAction from "./PositionRollerApproveAction";
import PositionRollerFullRollAction from "./PositionRollerFullRollAction";

interface Props {
	headers: string[];
	tab: string;
	positionToRoll: PositionQuery;
	position: PositionQuery;
}

export default function PositionRollerRow({ headers, tab, positionToRoll, position }: Props) {
	const [userCollAllowance, setUserCollAllowance] = useState<bigint>(0n);
	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const account = address || zeroAddress;

	useEffect(() => {
		if (account == zeroAddress) return;

		const fetcher = async function () {
			const allowance = await readContract(WAGMI_CONFIG, {
				address: position.collateral,
				abi: ERC20ABI,
				functionName: "allowance",
				args: [account, ADDRESS[WAGMI_CHAIN.id].roller],
			});

			setUserCollAllowance(allowance);
		};

		fetcher();
	}, [data, account, position.collateral]);

	const cooldownTimestamp = position.cooldown * 1000;
	const isCooldown = cooldownTimestamp > Date.now();
	const timeLeft = isCooldown ? (cooldownTimestamp - Date.now()) / 1000 / 60 / 60 : 0;
	const cooldownText = formatCurrency(timeLeft, 1, 1, FormatType.us) + "h cooldown";

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={
				// FIXME: use collateral instead of zchf
				false ? (
					<PositionRollerApproveAction amount={BigInt(positionToRoll.minted)} />
				) : (
					<PositionRollerFullRollAction
						label={isCooldown ? cooldownText : "Roll"}
						disabled={isCooldown}
						source={positionToRoll}
						target={position}
					/>
				)
			}
		>
			{/* Position */}
			<div className="flex flex-col md:text-left max-md:text-right">{shortenAddress(position.position)}</div>

			{/* Liquidation */}
			<div className="flex flex-col">
				{formatCurrency(formatUnits(BigInt(position.price), 36 - position.collateralDecimals), 2, 2)} ZCHF
			</div>

			{/* Interest */}
			<div className="flex flex-col">{formatCurrency(position.annualInterestPPM / 10_000, 2, 2)}%</div>

			{/* Maturity */}
			<div className="flex flex-col">{new Date(position.expiration * 1000).toLocaleDateString()}</div>
		</TableRow>
	);
}
