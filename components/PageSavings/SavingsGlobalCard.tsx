import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import AppLink from "@components/AppLink";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide } from "@frankencoin/zchf";
import DisplayOutputAlignedRight from "@components/DisplayOutputAlignedRight";
import { useContractUrl } from "@hooks";
import { getChain, shortenAddress } from "@utils";
import { useChainId } from "wagmi";
import { Address } from "viem";

export default function SavingsGlobalCard() {
	const { status } = useSelector((state: RootState) => state.savings.savingsInfo);
	const chainId = useChainId() as ChainId;
	const chain = getChain(chainId);

	const frankencoinAddress =
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin;
	const savings = (
		chainId == 1 ? ADDRESS[chainId as ChainIdMain].savingsReferral : ADDRESS[chainId as ChainIdSide].ccipBridgedSavings
	).toLowerCase() as Address;
	const link = useContractUrl(savings, chain);

	const state = status[chainId][savings];

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
				<AppBox>
					<DisplayLabel label="Current Interest Rate" />
					<DisplayOutputAlignedRight className="" amount={state.rate / 10_000} unit="%" />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Savings" />
					<DisplayAmount
						className="mt-1"
						amount={BigInt(state.balance)}
						digits={18}
						currency="ZCHF"
						address={frankencoinAddress}
						chain={chain.name}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Interest Paid" />
					<DisplayAmount
						className="mt-1"
						amount={BigInt(state.interest)}
						digits={18}
						currency="ZCHF"
						address={frankencoinAddress}
						chain={chain.name}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Contract Address" />
					<AppLink label={shortenAddress(savings)} href={link} external={true} />
				</AppBox>
			</div>
		</AppCard>
	);
}
