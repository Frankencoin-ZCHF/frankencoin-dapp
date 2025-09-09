import Head from "next/head";
import CollateralAndPositionsOverview from "@components/PageEcoSystem/CollateralAndPositionsOverview";
import AppTitle from "@components/AppTitle";
import DebtOutstanding from "@components/PageEcoSystem/DebtOutstanding";
import DebtAllocation from "@components/PageEcoSystem/DebtAllocation";

export default function Overview() {
	return (
		<div>
			<Head>
				<title>Frankencoin - Ecosystem</title>
			</Head>

			<AppTitle title={`Current Debt Allocation`}>
				<div className="text-text-secondary">
					Here, you will find the current debt of all collateral positions. The current debt is calculated as the total minted
					amount of a position minus the reserve contribution, which can be reclaimed by repaying the outstanding debt.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtAllocation />
			</div>

			<AppTitle title={`Open Debt Projected`}>
				<div className="text-text-secondary">
					Here you will find the open debt of all positions projected over the expiration. You can think of how much needs to
					repaid when. The owner could also roll the debt to a later expiration and pays the upfront interests. Those metric can
					be useful if you want to get a glance over changes to the total supply or potential future earnings.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<DebtOutstanding />
			</div>

			<AppTitle title={`Ecosystem Collateral`}>
				<div className="text-text-secondary">
					Here, you will find detailed information on all collateral positions, summarized with the most important details.
				</div>
			</AppTitle>

			<div className="my-[2rem]">
				<CollateralAndPositionsOverview />
			</div>
		</div>
	);
}
