import Head from "next/head";
import AppTitle from "@components/AppTitle";
import DebtOutstanding from "@components/PageEcoSystem/DebtOutstanding";
import DebtAllocation from "@components/PageEcoSystem/DebtAllocation";
import MintAllocation from "@components/PageEcoSystem/MintAllocation";
import FrankencoinAllocation from "@components/PageEcoSystem/FrankencoinAllocation";
import ReserveAllocation from "@components/PageEcoSystem/ReserveAllocation";
import ReserveCosts from "@components/PageEcoSystem/ReserveCosts";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Ecosystem</title>
			</Head>

			<AppTitle title={`Current Holder Allocation`}>
				<div className="text-text-secondary">
					This section provides an overview of how the total ZCHF supply is distributed among different holders. The Public
					Circulating Supply reflects tokens held directly by users in their wallets, while other portions are allocated to
					protocol reserves, centralized & decentralized exchanges, and external integrations such as Morpho.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<FrankencoinAllocation />
			</div>

			<AppTitle title={`Current Mint Allocation`}>
				<div className="text-text-secondary">
					This section provides an overview of the current mint of all collateral positions or any stablecoin swap bridges.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<MintAllocation />
			</div>

			<AppTitle title={`Current Debt Allocation`}>
				<div className="text-text-secondary">
					This section provides an overview of the current debt of all collateral positions. The current debt is calculated as the
					total minted amount of a position minus the reserve contribution, which can be reclaimed by repaying the outstanding
					debt.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtAllocation />
			</div>

			<AppTitle title={`Open Debt Projected`}>
				<div className="text-text-secondary">
					This section provides an overview of the open debt of all positions projected over the expiration. You can think of how
					much needs to repaid when. The owner could also roll the debt to a later expiration and pays the upfront interests.
					Those metric can be useful if you want to get a glance over changes to the total supply or potential future earnings.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtOutstanding />
			</div>

			<AppTitle title={`Current Reserve Contribution`}>
				<div className="text-text-secondary">
					In the Frankencoin protocol, reserves serve as the foundation of stability and loss protection. They consist of equity
					contributions from Frankencoin Pool Shares, including accumulated profits and losses, as well as reserve contributions
					from collateral positions. Together, these reserves form a safety buffer that supports the circulating supply and
					safeguards the system against potential losses.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<ReserveAllocation />
			</div>

			{/* <AppTitle title={`Reserve Costs Projected`}>
				<div className="text-text-secondary">This section provides an overview of ...</div>
			</AppTitle>

			<div className="my-[2rem]">
				<ReserveCosts />
			</div> */}
		</div>
	);
}
