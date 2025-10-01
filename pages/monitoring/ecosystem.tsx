import Head from "next/head";
import AppTitle from "@components/AppTitle";
import MintAllocation from "@components/PageEcoSystem/MintAllocation";
import FrankencoinAllocation from "@components/PageEcoSystem/FrankencoinAllocation";
import ReserveAllocation from "@components/PageEcoSystem/ReserveAllocation";
import MintOutstanding from "@components/PageEcoSystem/MintOutstanding";
import HealthRatio from "@components/PageEcoSystem/HealthRatio";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Ecosystem</title>
			</Head>

			<AppTitle title={`Frankencoin Holders`}>
				<div className="text-text-secondary">
					This section provides an overview of how the total ZCHF supply is distributed among different holders. The
					circulating supply reflects tokens held in uncategorized wallets, while other portions are allocated to
					protocol reserves, centralized & decentralized exchanges, and external integrations such as Morpho.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<FrankencoinAllocation />
			</div>

			<AppTitle title={`Origin`}>
				<div className="text-text-secondary">
					This section shows which collaterals are responsible for securing how much of the Frankencoin supply.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<MintAllocation />
			</div>

			{/* <AppTitle title={`Current Debt Allocation`}>
				<div className="text-text-secondary">
					This section provides an overview of the current debt of all collateral positions. The current debt is calculated as the
					total minted amount of a position minus the reserve contribution, which can be reclaimed by repaying the outstanding
					debt.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtAllocation />
			</div> */}

			<AppTitle title={`Expiration Trajectory`}>
				<div className="text-text-secondary">
					A chart showing by when the Frankencoins currently in circulation need to be repaid by their minters.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<MintOutstanding />
			</div>

			<AppTitle title={`Reserves`}>
				<div className="text-text-secondary">
					In case a position has to be liquidated because it is not well-collateralized any more, the losses are covered by
					three layers of reserves in the following order: first the minter reserve of the liquidated position is used.
					If that does not suffice, equity capital is burned. If that does not suffice either, the reserves of all other
					positions are proportionally reduced. After all the reserves have been burned, a furher loss would reduce the 
					fundamental value of the Frankencoin below the peg.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<ReserveAllocation />
			</div>

			<AppTitle title={`System Health`}>
				<div className="text-text-secondary">
					This chart shows how well the Frankencoins in free circulation are backed by collateral assets. All Frankencoins that are
					not in the reserve pool are considered in free circulation. To the extent this value falls below 100%, the fundamental value of 
					falls below below the peg. As long as the value is above 100%, all Frankencoins in free circulation are backed by collateral.
					The recording of historic watermarks started in September 2025.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<HealthRatio />
			</div>
		</div>
	);
}
