import { formatUnits, zeroAddress } from "viem";
import TableRow from "../Table/TableRow";
import { PositionQuery } from "@frankencoin/api";
import { formatCurrency, shortenAddress } from "../../utils/format";
import Button from "@components/Button";
import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { WAGMI_CHAIN, WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, FrankencoinABI } from "@frankencoin/zchf";
import { useAccount } from "wagmi";
import PositionRollerApproveAction from "./PositionRollerApproveAction";

interface Props {
	headers: string[];
	tab: string;
	positionToRoll: PositionQuery;
	position: PositionQuery;
}

export default function PositionRollerRow({ headers, tab, positionToRoll, position }: Props) {
	const [userAllowance, setUserAllowance] = useState<bigint>(0n);
	const { address } = useAccount();
	const account = address || zeroAddress;

	useEffect(() => {
		if (account == zeroAddress) return;

		const fetcher = async function () {
			const allowance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[WAGMI_CHAIN.id].equity,
				abi: FrankencoinABI,
				functionName: "allowance",
				args: [account, ADDRESS[WAGMI_CHAIN.id].roller],
			});

			setUserAllowance(allowance);
		};

		fetcher();
	}, [account]);

	return (
		<TableRow
			headers={headers}
			tab={tab}
			actionCol={
				userAllowance < BigInt(positionToRoll.minted) ? (
					<PositionRollerApproveAction amount={BigInt(positionToRoll.minted)} />
				) : (
					<Button className="h-10" size="md">
						Roll
					</Button>
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
