import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { PositionQuery, PriceQueryObjectArray } from "@frankencoin/api";
import { Address, formatUnits } from "viem";
import { normalizeAddress } from "../../utils/format";
import { useEffect, useState } from "react";
import PositionRollerRow from "./PositionRollerRow";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { mainnet } from "viem/chains";
import AppButton from "@components/AppButton";
import { useRouter as useNavigation } from "next/navigation";
import { readContract, readContracts } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, FrankencoinABI, PositionRollerV2ABI } from "@frankencoin/zchf";

type PositionRollerTableParams = {
	position: PositionQuery;
	challengeSize: bigint;
};

export default function PositionRollerTable({ position, challengeSize }: PositionRollerTableParams) {
	const navigate = useNavigation();

	const headers: string[] = ["Position", "Liquidation Price", "Annual Interest", "Maturity"];
	const [tab, setTab] = useState<string>(headers[3]);
	const [reverse, setReverse] = useState<boolean>(false);
	const [list, setList] = useState<PositionQuery[]>([]);
	const [isRepayable, setRepayable] = useState<boolean>(true);
	const [prepareAmount, setPrepareAmount] = useState<bigint>(0n);

	// The roller repays what its own search returns. For some minted amounts, no repayment frees exactly that amount.
	// The search then settles for one that frees slightly more, which the position rejects with RepaidTooMuch.
	// Repaying a tiny amount beforehand moves the minted amount to the next lower value that can be repaid exactly.
	useEffect(() => {
		let stale = false;

		const fetcher = async function () {
			const minted = BigInt(position.minted);
			const repayment = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].rollerV2,
				chainId: mainnet.id,
				abi: PositionRollerV2ABI,
				functionName: "findRepaymentAmount",
				args: [position.position],
			});
			if (stale) return;
			if (repayment == 0n) {
				setRepayable(true);
				setPrepareAmount(0n);
				return;
			}

			const freedAmount = (amount: bigint) =>
				({
					address: ADDRESS[mainnet.id].frankencoin,
					chainId: mainnet.id,
					abi: FrankencoinABI,
					functionName: "calculateFreedAmount",
					args: [amount, position.reserveContribution],
				} as const);
			// what the roller would free, the highest amount below that, and what the smallest possible repayment frees
			const [freed, freedBelow, freedByOne] = await readContracts(WAGMI_CONFIG, {
				allowFailure: false,
				contracts: [freedAmount(repayment), freedAmount(repayment - 1n), freedAmount(1n)],
			});
			if (stale) return;

			const repayable = freed <= minted;
			setRepayable(repayable);
			// only offer the preparation if it provably leads to a repayable amount, which is the case for reserves below 50%
			setPrepareAmount(!repayable && minted - freedByOne == freedBelow ? 1n : 0n);
		};

		fetcher();
		return () => {
			stale = true;
		};
	}, [position.position, position.minted, position.reserveContribution]);

	const positions = useSelector((state: RootState) => state.positions.list.list);
	const challengesPosMap = useSelector((state: RootState) => state.challenges.positions.map);
	const prices = useSelector((state: RootState) => state.prices.coingecko);

	const matchingPositions = positions.filter((p) => {
		const pid: Address = normalizeAddress(p.position);
		const isChallenged: boolean = (challengesPosMap[pid] || []).filter((c) => c.status == "Active").length > 0;
		return (
			p.version == 2 &&
			normalizeAddress(p.collateral) === normalizeAddress(position.collateral) &&
			p.expiration > position.expiration && // also excludes same position
			p.expiration * 1000 > Date.now() && // an expired source would otherwise be offered expired targets
			!p.closed &&
			!p.denied &&
			BigInt(p.availableForClones) > BigInt(position.minted) &&
			!isChallenged
		);
	});

	const sorted: PositionQuery[] = sortPositions({
		positions: matchingPositions,
		prices,
		headers,
		tab,
		reverse,
	});

	useEffect(() => {
		const idList = list.map((l) => l.position).join("_");
		const idSorted = sorted.map((l) => l.position).join("_");
		if (idList != idSorted) setList(sorted);
	}, [list, sorted]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			if (e === headers[1]) setReverse(true);
			else setReverse(false);

			setTab(e);
		}
	};

	const handleClick = function (position: PositionQuery) {
		const slug = `?source=${normalizeAddress(position.position)}&chain=ethereum`;
		navigate.push("/mint/create" + slug);
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} actionCol />
			<TableBody>
				{list.length == 0 ? (
					<TableRowEmpty>
						{
							<div className={`flex flex-col`}>
								<div className="">No open positions available for rolling.</div>
								<div className="mt-4">
									<AppButton className="h-10" onClick={() => handleClick(position)}>
										Create Proposal to Renew this Collateral
									</AppButton>
								</div>
							</div>
						}
					</TableRowEmpty>
				) : (
					list.map((pos) => (
						<PositionRollerRow
							headers={headers}
							tab={tab}
							source={position}
							target={pos}
							challengeSize={challengeSize}
							isRepayable={isRepayable}
							prepareAmount={prepareAmount}
							key={pos.position}
						/>
					))
				)}
			</TableBody>
		</Table>
	);
}

type SortPositions = {
	positions: PositionQuery[];
	prices: PriceQueryObjectArray;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortPositions(params: SortPositions): PositionQuery[] {
	const { positions, prices, headers, tab, reverse } = params;
	let sortingList = [...positions]; // make it writeable

	if (tab === headers[0]) {
		// sort position address
		sortingList.sort((a, b) => a.position.localeCompare(b.position));
	} else if (tab === headers[1]) {
		// sort for liq. price
		sortingList.sort((a, b) => {
			const calc = function (p: PositionQuery) {
				const liqPrice: number = parseFloat(formatUnits(BigInt(p.price), 36 - p.collateralDecimals));
				return liqPrice;
			};
			return calc(b) - calc(a);
		});
	} else if (tab === headers[2]) {
		// sort for interest
		sortingList.sort((a, b) => {
			return b.annualInterestPPM - a.annualInterestPPM;
		});
	} else if (tab === headers[3]) {
		// sort for maturity
		sortingList.sort((a, b) => {
			return b.expiration - a.expiration;
		});
	}

	return reverse ? sortingList.reverse() : sortingList;
}
