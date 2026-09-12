import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { formatUnits } from "viem";
import { PositionQuery } from "@frankencoin/api";
import Table from "@components/Table";
import TableHead from "@components/Table/TableHead";
import TableBody from "@components/Table/TableBody";
import TableRow from "@components/Table/TableRow";
import TableRowEmpty from "@components/Table/TableRowEmpty";
import { RootState } from "../../redux/redux.store";
import { formatCurrency, formatDate, normalizeAddress, shortenAddress } from "@utils";

const HEADERS = ["Position", "Owner", "Minted", "Collateral", "Liq. Price", "Expiration"];

interface Props {
	position: PositionQuery; // the position currently being viewed
}

export default function PositionFamilyTable({ position }: Props) {
	const [tab, setTab] = useState(HEADERS[0]);
	const [reverse, setReverse] = useState(false);

	const router = useRouter();
	const all = useSelector((state: RootState) => state.positions.list.list);

	// every position sharing this original, the original and the current position included
	const family = useMemo(() => {
		const original = normalizeAddress(position.original);
		return all.filter((p) => normalizeAddress(p.original) === original);
	}, [all, position.original]);

	const sorted = useMemo(() => {
		const s = [...family].sort((a, b) => {
			// default order: the original leads, clones follow by age
			if (tab === HEADERS[0]) {
				if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1;
				return a.created - b.created;
			}
			if (tab === HEADERS[1]) return a.owner.localeCompare(b.owner);
			if (tab === HEADERS[2]) return Number(BigInt(b.minted) - BigInt(a.minted));
			if (tab === HEADERS[3]) {
				const coll = (p: PositionQuery) => parseFloat(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals));
				return coll(b) - coll(a);
			}
			if (tab === HEADERS[4]) {
				const liq = (p: PositionQuery) => parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				return liq(b) - liq(a);
			}
			if (tab === HEADERS[5]) return b.expiration - a.expiration;
			return 0;
		});
		return reverse ? s.reverse() : s;
	}, [family, tab, reverse]);

	const handleTabChange = (header: string) => {
		if (tab === header) {
			setReverse((r) => !r);
		} else {
			setTab(header);
			setReverse(false);
		}
	};

	const current = normalizeAddress(position.position);

	return (
		<Table>
			<TableHead headers={HEADERS} tab={tab} reverse={reverse} tabOnChange={handleTabChange} />
			<TableBody>
				{sorted.length === 0 ? (
					<TableRowEmpty>No related positions found.</TableRowEmpty>
				) : (
					sorted.map((p) => {
						const isCurrent = normalizeAddress(p.position) === current;

						return (
							<div key={p.position} onClick={isCurrent ? undefined : () => router.push(`/monitoring/${p.position}`)}>
								<TableRow headers={HEADERS} tab={tab} rawHeader={true} className={isCurrent ? "" : "cursor-pointer"}>
									{/* Position */}
									<div className="text-left font-bold text-md">
										{isCurrent ? "Current position" : shortenAddress(p.position)}
									</div>

									{/* Owner */}
									<div className="text-right">{shortenAddress(p.owner)}</div>

									{/* Minted */}
									<div className="text-right">{formatCurrency(formatUnits(BigInt(p.minted), 18))} ZCHF</div>

									{/* Collateral */}
									<div className="text-right">
										{formatCurrency(formatUnits(BigInt(p.collateralBalance), p.collateralDecimals))}{" "}
										{p.collateralSymbol}
									</div>

									{/* Liq. Price */}
									<div className="text-right">
										{formatCurrency(formatUnits(BigInt(p.price), 36 - p.collateralDecimals))} ZCHF
									</div>

									{/* Expiration */}
									<div className={`text-right ${p.closed ? "text-text-subheader" : ""}`}>
										{p.closed ? "—" : formatDate(p.expiration)}
									</div>
								</TableRow>
							</div>
						);
					})
				)}
			</TableBody>
		</Table>
	);
}
