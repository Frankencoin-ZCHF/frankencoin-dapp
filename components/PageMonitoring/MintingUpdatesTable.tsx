import { useState } from "react";
import { MintingUpdateQuery, PositionQuery } from "@frankencoin/api";
import Table from "@components/Table";
import TableHead from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRow from "@components/Table/TableRow";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import AppLink from "@components/AppLink";
import { formatCurrency, formatDate, TxUrl } from "@utils";
import { formatUnits, Hash } from "viem";

const HEADERS = ["Date", "Price", "Δ Minted", "Δ Collateral", "Fee Paid"];

type EnrichedUpdate = {
	update: MintingUpdateQuery;
	mintDelta: bigint;
	collDelta: bigint;
	isFirst: boolean;
};

interface Props {
	updates: MintingUpdateQuery[];
	position: PositionQuery;
}

export default function MintingUpdatesTable({ updates, position }: Props) {
	const [tab, setTab] = useState(HEADERS[0]);
	const [reverse, setReverse] = useState(false);

	const priceDigit = 36 - position.collateralDecimals;

	// Always compute deltas in chronological order (ascending count)
	const chronological = [...updates].sort((a, b) => a.count - b.count);
	const enriched: EnrichedUpdate[] = chronological.map((u, i) => ({
		update: u,
		mintDelta: BigInt(u.minted) - BigInt(chronological[i - 1]?.minted ?? "0"),
		collDelta: BigInt(u.size) - BigInt(chronological[i - 1]?.size ?? "0"),
		isFirst: i === 0,
	}));

	const sorted = [...enriched].sort((a, b) => {
		switch (tab) {
			case "Date":
				return b.update.count - a.update.count;
			case "Price":
				return Number(BigInt(b.update.price) - BigInt(a.update.price));
			case "Δ Minted":
				return Number(b.mintDelta - a.mintDelta);
			case "Δ Collateral":
				return Number(b.collDelta - a.collDelta);
			case "Fee Paid":
				return Number(BigInt(b.update.feePaid) - BigInt(a.update.feePaid));
			default:
				return 0;
		}
	});

	const displayed = reverse ? [...sorted].reverse() : sorted;

	const handleTabChange = (header: string) => {
		if (tab === header) setReverse((r) => !r);
		else {
			setTab(header);
			setReverse(false);
		}
	};

	return (
		<Table>
			<TableHead headers={HEADERS} tab={tab} reverse={reverse} tabOnChange={handleTabChange} />
			<TableBody>
				{displayed.length === 0 ? (
					<TableRowEmpty>No minting updates found.</TableRowEmpty>
				) : (
					displayed.map(({ update, mintDelta, collDelta, isFirst }, idx) => (
						<MintingUpdateRow
							key={update.txHash || idx}
							update={update}
							position={position}
							priceDigit={priceDigit}
							mintDelta={mintDelta}
							collDelta={collDelta}
							isFirst={isFirst}
							tab={tab}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

interface RowProps {
	update: MintingUpdateQuery;
	position: PositionQuery;
	priceDigit: number;
	mintDelta: bigint;
	collDelta: bigint;
	isFirst: boolean;
	tab: string;
}

function MintingUpdateRow({ update, position, priceDigit, mintDelta, collDelta, isFirst, tab }: RowProps) {
	const feePaid = BigInt(update.feePaid);
	const priceProposed = !isFirst && BigInt(update.priceAdjusted) > 0n;

	return (
		<TableRow headers={HEADERS} tab={tab} rawHeader={true}>
			{/* Date → tx link */}
			<div className="text-left">
				<AppLink className="" label={formatDate(update.created)} href={TxUrl(update.txHash as Hash)} external={true} />
			</div>

			{/* Liq price — highlighted if changed this tx */}
			<div className={`text-right ${priceProposed ? "text-amber-400 font-medium" : ""}`}>
				{formatCurrency(formatUnits(BigInt(update.price), priceDigit))} ZCHF
			</div>

			{/* Δ Minted */}
			<div className="text-right">
				{mintDelta > 0n ? (
					<span className="text-green-500">+{formatCurrency(formatUnits(mintDelta, 18))} ZCHF</span>
				) : mintDelta < 0n ? (
					<span className="text-red-400">{formatCurrency(formatUnits(mintDelta, 18))} ZCHF</span>
				) : (
					<span className="text-text-secondary">—</span>
				)}
			</div>

			{/* Δ Collateral */}
			<div className="text-right">
				{collDelta > 0n ? (
					<span className="text-green-500">
						+{formatCurrency(formatUnits(collDelta, position.collateralDecimals))} {position.collateralSymbol}
					</span>
				) : collDelta < 0n ? (
					<span className="text-red-400">
						{formatCurrency(formatUnits(collDelta, position.collateralDecimals))} {position.collateralSymbol}
					</span>
				) : (
					<span className="text-text-secondary">—</span>
				)}
			</div>

			{/* Fee Paid */}
			<div className="text-right">
				{feePaid > 0n ? <>{formatCurrency(formatUnits(feePaid, 18))} ZCHF</> : <span className="text-text-secondary">—</span>}
			</div>
		</TableRow>
	);
}
