import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { Address, zeroAddress } from "viem";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../../app.config";
import { mainnet } from "viem/chains";

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

	const frankencoin = ADDRESS[mainnet.id].frankencoin;

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				<AppBox>
					<DisplayLabel label="Total Owed" />
					<DisplayAmount className="mt-1" amount={totalOwed} currency="ZCHF" address={frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Reserves" />
					<DisplayAmount className="mt-1" amount={totalReserves} currency="ZCHF" address={frankencoin} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Minted" />
					<DisplayAmount className="mt-1" amount={totalMinted} currency="ZCHF" address={frankencoin} />
				</AppBox>
			</div>
		</AppCard>
	);
}
