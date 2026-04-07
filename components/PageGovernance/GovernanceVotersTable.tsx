import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";
import { Address, formatUnits, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import { useFPSHolders, useDelegationQuery, computeSupporterCount } from "@hooks";
import type { FPSHolder } from "@hooks";
import { useVotingPowers } from "@hooks";
import GovernanceVotersRow from "./GovernanceVotersRow";

import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { ADDRESS, EquityABI } from "@frankencoin/zchf";
import { mainnet } from "viem/chains";

export type VoteData = {
	holder: Address;
	balance: bigint;
	votingPower: bigint;
	votingPowerRatio: number;
	holdingDuration: bigint;
	supporterCount: number;
};

export default function GovernanceVotersTable() {
	const headers: string[] = ["Address", "Supporters", "Voting Power"];
	const [tab, setTab] = useState<string>(headers[2]); // default sort: Voting Power
	const [reverse, setReverse] = useState<boolean>(false);
	const [accountVotes, setAccountVotes] = useState<VoteData>({
		balance: 0n,
		holder: zeroAddress,
		votingPower: 0n,
		votingPowerRatio: 0,
		holdingDuration: 0n,
		supporterCount: 0,
	});
	const [list, setList] = useState<VoteData[]>([]);

	const account = useAccount();
	const chainId = mainnet.id;
	const { delegatees } = useDelegationQuery();
	const fpsHolders = useFPSHolders();

	const existingAccounts = new Set(fpsHolders.holders.map((h) => h.account.toLowerCase()));
	const delegateeHolders: FPSHolder[] = Object.keys(delegatees)
		.filter((addr) => !existingAccounts.has(addr.toLowerCase()))
		.map((addr) => ({ account: addr as Address, balance: 0n, updated: 0 }));
	const allHolders = [...fpsHolders.holders, ...delegateeHolders];

	const votingPowersHook = useVotingPowers(allHolders);
	const votesTotal = votingPowersHook.totalVotes;
	const votesData: VoteData[] = votingPowersHook.votesData.map((vp) => {
		const ratio: number = parseInt(vp.votingPower.toString()) / parseInt(votesTotal.toString());
		return {
			holder: vp.holder as Address,
			balance: BigInt(vp.balance),
			votingPower: vp.votingPower as bigint,
			votingPowerRatio: ratio,
			holdingDuration: vp.holdingDuration,
			supporterCount: computeSupporterCount(vp.holder as Address, delegatees),
		};
	});

	useEffect(() => {
		if (account.address == undefined) return;
		const holder = account.address;

		const fetcher = async function () {
			const fps = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].equity,
				chainId: chainId,
				abi: EquityABI,
				functionName: "balanceOf",
				args: [holder],
			});

			const votingPowerRatio = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].equity,
				chainId: chainId,
				abi: EquityABI,
				functionName: "relativeVotes",
				args: [holder],
			});

			const holdingDuration = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[mainnet.id].equity,
				chainId: chainId,
				abi: EquityABI,
				functionName: "holdingDuration",
				args: [holder],
			});

			const votingPower = votingPowerRatio * votesTotal;

			setAccountVotes({
				holder,
				balance: fps,
				votingPower,
				votingPowerRatio: parseFloat(formatUnits(votingPowerRatio, 18)),
				holdingDuration: holdingDuration,
				supporterCount: computeSupporterCount(holder as Address, delegatees),
			});
		};

		fetcher();
	}, [account, votesTotal, chainId, delegatees]);

	const matchingVotes: VoteData[] = votesData.filter((v) => v.holder.toLowerCase() !== account.address?.toLowerCase());
	const votesDataSorted: VoteData[] = sortVotes({
		votes: matchingVotes,
		account: account.address,
		headers,
		reverse,
		tab,
	}).slice(0, 15);

	useEffect(() => {
		const idList = list.map((l) => l.holder).join("_");
		const idSorted = votesDataSorted.map((l) => l.holder).join("_");
		if (idList != idSorted) setList(votesDataSorted);
	}, [list, votesDataSorted]);

	const handleTabOnChange = function (e: string) {
		if (tab === e) {
			setReverse(!reverse);
		} else {
			setReverse(false);
			setTab(e);
		}
	};

	return (
		<Table>
			<TableHeader headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabOnChange} />
			<TableBody>
				<>
					{account.address ? (
						<GovernanceVotersRow
							key={account.address}
							headers={headers}
							tab={tab}
							voter={accountVotes}
							votesTotal={votesTotal}
							connectedWallet
						/>
					) : null}
					{list.length == 0 ? (
						<TableRowEmpty>{"There are no voters yet"}</TableRowEmpty>
					) : (
						list.map((vote) => (
							<GovernanceVotersRow key={vote.holder} headers={headers} tab={tab} voter={vote} votesTotal={votesTotal} />
						))
					)}
				</>
			</TableBody>
		</Table>
	);
}

type SortVotes = {
	votes: VoteData[];
	account: Address | undefined;
	headers: string[];
	tab: string;
	reverse: boolean;
};

function sortVotes(params: SortVotes): VoteData[] {
	const { votes, account, headers, tab, reverse } = params;

	if (tab === headers[0]) {
		votes.sort((a, b) => a.holder.localeCompare(b.holder));
	} else if (tab === headers[1]) {
		votes.sort((a, b) => b.supporterCount - a.supporterCount);
	} else if (tab === headers[2]) {
		votes.sort((a, b) => (b.votingPower > a.votingPower ? 1 : -1));
	}

	const considerReverse = reverse ? votes.reverse() : votes;

	if (!!account) {
		considerReverse.sort((a, b) => (a.holder.toLowerCase() === account.toLowerCase() ? -1 : 1));
	}

	return considerReverse;
}
