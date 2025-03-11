import AppCard from "@components/AppCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { Address, zeroAddress } from "viem";
import TokenInput from "@components/Input/TokenInput";

export default function MyPositionsTotalsCard() {
	const positions = useSelector((state: RootState) => state.positions.openPositions);

	const router = useRouter();
	const overwrite = router.query.address as Address;

	const { address } = useAccount();
	const account = overwrite || address || zeroAddress;

	const matchingPositions = positions.filter((p) => p.owner.toLowerCase() == account.toLowerCase());

	let totalMinted: bigint = 0n;
	let totalReserves: bigint = 0n;

	for (let p of matchingPositions) {
		const minted = BigInt(p.minted);
		const reserve = BigInt(p.reserveContribution);
		totalMinted += minted;
		totalReserves += (minted * reserve) / 1_000_000n;
	}

	const totalOwed: bigint = totalMinted - totalReserves;

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2 -mb-4">
				<TokenInput label="Total Owed" symbol="ZCHF" disabled={true} value={totalOwed.toString()} />
				<TokenInput label="Total Reserves" symbol="ZCHF" disabled={true} value={totalReserves.toString()} />
				<TokenInput label="Total Minted" symbol="ZCHF" disabled={true} value={totalMinted.toString()} />
			</div>
		</AppCard>
	);
}
