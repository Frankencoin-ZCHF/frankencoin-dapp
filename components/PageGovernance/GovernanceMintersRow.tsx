import { Address, Chain, formatUnits, Hash } from "viem";
import TableRow from "../Table/TableRow";
import { ChainId, SupportedChain, SupportedChainsMap } from "@frankencoin/zchf";
import { MinterQuery } from "@frankencoin/api";
import GovernanceMintersAction from "./GovernanceMintersAction";
import AppLink from "@components/AppLink";
import { ContractUrl, formatCurrency, shortenAddress, TxUrl } from "@utils";
import { useUnannouncedMinter } from "@hooks";

interface Props {
	headers: string[];
	tab: string;
	minter: MinterQuery;
}

export default function GovernanceMintersRow({ headers, tab, minter }: Props) {
	// @dev: only pending applications can be vetoed, so the announcement state is only read for those
	const isPending = !!minter && !minter.vetor && Date.now() < (minter.applyDate + minter.applicationPeriod) * 1000;
	const { isUnannounced, reward } = useUnannouncedMinter(minter?.minter as Address, minter?.chainId as ChainId, isPending);

	if (!minter) return null;

	const vetoUntil = (minter.applyDate + minter.applicationPeriod) * 1000;
	const hoursUntil: number = (vetoUntil - Date.now()) / 1000 / 60 / 60;
	const stateStr: string = hoursUntil < 1.5 ? `${Math.round(hoursUntil * 60)} minutes left` : `${Math.round(hoursUntil)} hours left`;

	const passed: boolean = hoursUntil < 0;
	const vetoed: boolean = minter.vetor ? true : false;
	const isDisabled: boolean = vetoed || passed;
	const showUnannounced: boolean = isUnannounced && !isDisabled;

	const dateArr: string[] = new Date(minter.applyDate * 1000).toDateString().split(" ");
	const dateStr: string = `${dateArr[2]} ${dateArr[1]} ${dateArr[3]}`;

	return (
		<TableRow
			headers={headers}
			rawHeader={true}
			tab={tab}
			footer={
				showUnannounced ? (
					<div className="text-sm text-center">
						Unannounced minter, can be vetoed by anyone.
						{reward > 0n ? ` ${formatCurrency(formatUnits(reward, 18))} ZCHF reward.` : ""}
					</div>
				) : undefined
			}
			actionCol={
				<div className="">
					{isDisabled ? null : (
						<GovernanceMintersAction
							key={`${minter.chainId}:${minter.minter}`}
							minter={minter}
							disabled={isDisabled}
							unannounced={showUnannounced}
							reward={reward}
						/>
					)}
				</div>
			}
		>
			<div className="flex flex-col md:text-left max-md:text-right">
				<AppLink
					label={dateStr}
					href={TxUrl(minter.txHash as Hash, SupportedChainsMap[minter.chainId as ChainId] as SupportedChain)}
					external={true}
					className=""
				/>
			</div>

			{/* Minter */}
			<div className="flex flex-col">
				<AppLink
					label={shortenAddress(minter.minter)}
					href={ContractUrl(minter.minter, SupportedChainsMap[minter.chainId as ChainId] as SupportedChain)}
					external={true}
					className=""
				/>
			</div>

			{/* ChainId */}
			<div className="flex flex-col">{(SupportedChainsMap[minter.chainId as ChainId] as Chain).name}</div>

			{/* Comment */}
			<div className="flex flex-col">{minter.applyMessage}</div>

			{/* State */}
			<div className={`flex flex-col ${vetoed || passed ? "" : "font-bold"}`}>{vetoed ? "Vetoed" : passed ? "Passed" : stateStr}</div>
		</TableRow>
	);
}
