import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import AppLink from "@components/AppLink";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide } from "@frankencoin/zchf";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { getChain } from "@utils";
import { useChainId } from "wagmi";
import { Address } from "viem";

export default function SavingsGlobalCard() {
	const { status, totalBalance, totalInterest, ratioOfSupply } = useSelector((state: RootState) => state.savings.savingsInfo);
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const frankencoinAddress =
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin;
	const savings = (
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].savingsReferral : ADDRESS[chainId as ChainIdSide].ccipBridgedSavings
	).toLowerCase() as Address;

	const state = status[chainId][savings];

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				<AppBox>
					<DisplayLabel label="Current Interest Rate" />
					<DisplayOutputAlignedRight className="" amount={state.rate / 10_000} unit="%" />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Savings" />
					<DisplayAmount
						className="mt-1"
						amount={totalBalance}
						digits={0}
						currency="ZCHF"
						address={frankencoinAddress}
						chain={chain.name}
						hideChain={true}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Interest Paid" />
					<DisplayAmount
						className="mt-1"
						amount={totalInterest}
						digits={0}
						currency="ZCHF"
						address={frankencoinAddress}
						chain={chain.name}
						hideChain={true}
					/>
				</AppBox>
				{/* <AppBox>
					<DisplayLabel label="Total Supply in Savings %" />
					<DisplayOutputAlignedRight className="" amount={ratioOfSupply * 100} unit="%" />
				</AppBox> */}
			</div>
		</AppCard>
	);
}
