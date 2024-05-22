import { Address, zeroAddress } from "viem";
import DisplayAmount from "../DisplayAmount";
import { usePositionStats, useTokenPrice, useZchfPrice } from "@hooks";
import TableRow from "../Table/TableRow";
import { useAccount, useChainId } from "wagmi";
import { ADDRESS } from "../../contracts/address";
import Link from "next/link";
import { Badge } from "flowbite-react";
import { PositionQuery } from "../../redux/slices/positions.types";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";

interface Props {
	position: PositionQuery;
}

export default function PositionRow({ position }: Props) {
	const { address } = useAccount();
	const chainId = useChainId();
	// const positionStats = usePositionStats(position.position, position.collateral);
	// const positionStats = usePositionStats(position.position, position.collateral);
	const prices = useSelector((state: RootState) => state.prices.coingecko);
	const collTokenPrice = prices[position.collateral.toLowerCase() as Address]?.price?.usd;
	const zchfPrice = prices[position.zchf.toLowerCase() as Address]?.price?.usd;
	if (!collTokenPrice || !zchfPrice) return null;

	const account = address || zeroAddress;
	const isMine = position.owner == account;

	const mintedPct = Math.floor((parseInt(position.minted) / parseInt(position.limitForPosition)) * 1000) / 10;
	const mintedConesPct = Math.floor((1 - parseInt(position.availableForClones) / parseInt(position.limitForClones)) * 1000) / 10;

	return (
		<TableRow
			link={`/position/${position.position}`}
			actionCol={
				isMine ? (
					<Link href={`/position/${position.position}/adjust`} className="btn btn-primary w-full">
						Adjust
					</Link>
				) : BigInt(position.availableForPosition) > 0n && !position.closed ? (
					<Link href={`/position/${position.position}/borrow`} className="btn btn-primary w-full">
						Clone & Mint
					</Link>
				) : (
					<></>
				)
			}
		>
			<div>
				<DisplayAmount
					amount={BigInt(position.collateralBalance)}
					currency={position.collateralSymbol}
					digits={position.collateralDecimals}
					address={position.collateral}
					usdPrice={collTokenPrice}
				/>
			</div>
			<div>
				<DisplayAmount
					amount={BigInt(position.price)}
					currency={"ZCHF"}
					hideLogo
					// bold={positionStats.cooldown * 1000n > Date.now()}
					digits={36 - position.collateralDecimals}
					address={ADDRESS[chainId].frankenCoin}
					usdPrice={zchfPrice}
				/>
			</div>

			<div className="flex items-center">
				{position.denied ? (
					<Badge color="dark">Denied</Badge>
				) : BigInt(position.collateralBalance) == 0n ? (
					<Badge color="dark">Closed</Badge>
				) : (
					<DisplayAmount
						amount={BigInt(position.availableForClones)}
						currency={"ZCHF"}
						hideLogo
						address={ADDRESS[chainId].frankenCoin}
						usdPrice={zchfPrice}
					/>
				)}
			</div>
		</TableRow>
	);
}
