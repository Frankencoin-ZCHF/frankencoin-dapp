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
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";

interface Props {
	headers: string[];
	tab: string;
	source: PositionQuery;
	target: PositionQuery;
}

export default function PositionRollerRow({ headers, tab, source, target }: Props) {
	const [userCollAllowance, setUserCollAllowance] = useState<bigint>(0n);
	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const account = address || zeroAddress;

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

	const cooldownTimestamp = target.cooldown * 1000;
	const isCooldown = cooldownTimestamp > Date.now();
	const timeLeft = isCooldown ? (cooldownTimestamp - Date.now()) / 1000 / 60 / 60 : 0;
	const cooldownText = formatCurrency(timeLeft, 1, 1, FormatType.us) + "h Cooldown";

	const isTargetOwned = target.owner.toLowerCase() === source.owner.toLowerCase();

	const dateArr: string[] = new Date(target.expiration * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow
			headers={headers}
			rawHeader={true}
			tab={tab}
			actionCol={
				address && userCollAllowance < BigInt(source.collateralBalance) ? (
					<PositionRollerApproveAction source={source} disabled={isCooldown} />
				) : (
					<PositionRollerFullRollAction
						label={isCooldown ? cooldownText : isTargetOwned ? "Merge" : "Roll"}
						disabled={isCooldown}
						source={source}
						target={target}
					/>
				)
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
				{formatCurrency(formatUnits(BigInt(target.price), 36 - target.collateralDecimals), 2, 2)} ZCHF
			</div>

			{/* Interest */}
			<div className="flex flex-col">{formatCurrency(target.annualInterestPPM / 10_000, 2, 2)}%</div>

			{/* Maturity */}
			<div className="flex flex-col">{dateStr}</div>
		</TableRow>
	);
}
