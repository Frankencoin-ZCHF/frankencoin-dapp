import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import AppLink from "@components/AppLink";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import { WAGMI_CHAIN } from "../../app.config";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { useContractUrl } from "@hooks";
import { shortenAddress } from "@utils";
import { mainnet } from "viem/chains";

export default function SavingsGlobalCard() {
	const { totalBalance, totalSaved, totalWithdrawn, totalInterest, rate, ratioOfSupply } = useSelector(
		(state: RootState) => state.savings.savingsInfo
	);

	const frankencoinAddress = ADDRESS[mainnet.id].frankencoin;
	const savings = ADDRESS[mainnet.id].savingsReferral;
	const link = useContractUrl(savings);

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
				<AppBox>
					<DisplayLabel label="Current Interest Rate" />
					<DisplayOutputAlignedRight className="" amount={rate / 10_000} unit="%" />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Savings" />
					<DisplayAmount className="mt-1" amount={totalBalance} currency="ZCHF" address={frankencoinAddress} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Interest Paid" />
					<DisplayAmount className="mt-1" amount={totalInterest} currency="ZCHF" address={frankencoinAddress} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Contract Address" />
					<AppLink label={shortenAddress(savings)} href={link} external={true} />
				</AppBox>
			</div>
		</AppCard>
	);
}
