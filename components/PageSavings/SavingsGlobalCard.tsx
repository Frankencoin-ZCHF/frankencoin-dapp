import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useSelector } from "react-redux";
import { parseEther } from "viem";
import { RootState } from "../../redux/redux.store";

export default function SavingsGlobalCard() {
	const { totalBalance, totalSaved, totalWithdrawn, totalInterest, rate, ratioOfSupply } = useSelector(
		(state: RootState) => state.savings.savingsInfo
	);

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
				<AppBox>
					<DisplayLabel label="Total Saved Balance" />
					<DisplayAmount amount={totalBalance} currency="ZCHF" />
				</AppBox>

				<AppBox>
					<DisplayLabel label="Total Supply Saved" />
					<DisplayAmount className="mt-1" amount={ratioOfSupply} currency="%" hideLogo />
				</AppBox>

				<AppBox>
					<DisplayLabel label="Total Interest Claimed" />
					<DisplayAmount amount={totalInterest} currency="ZCHF" />
				</AppBox>

				<AppBox>
					<DisplayLabel label="Saving Rate" />
					<DisplayAmount className="mt-1" amount={rate / 10_000} currency="%" hideLogo />
				</AppBox>
			</div>
		</AppCard>
	);
}
