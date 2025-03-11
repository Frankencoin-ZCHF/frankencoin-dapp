import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { ADDRESS } from "@frankencoin/zchf";
import { useChainId } from "wagmi";
import { useContractUrl } from "@hooks";
import { WAGMI_CHAIN } from "../../app.config";

export default function SavingsGlobalCard() {
	const { totalBalance, totalSaved, totalWithdrawn, totalInterest, rate, ratioOfSupply } = useSelector(
		(state: RootState) => state.savings.savingsInfo
	);

	const moduleAddress = ADDRESS[useChainId()].savings;
	const frankencoinAddress = ADDRESS[WAGMI_CHAIN.id].frankenCoin;
	const url = useContractUrl(moduleAddress);

	return (
		<AppCard>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				<AppBox>
					<DisplayLabel label="Current Interest Rate" />
					<DisplayAmount className="mt-1" amount={rate / 10_000} unit="%" hideLogo />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Savings" />
					<DisplayAmount className="mt-1" amount={totalBalance} currency="ZCHF" address={frankencoinAddress} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Total Paid Out" />
					<DisplayAmount className="mt-1" amount={totalInterest} currency="ZCHF" address={frankencoinAddress} />
				</AppBox>
				{/* <AppBox>
					<DisplayLabel label="Module Contract" />
					<Link href={url} target="_blank">
						<div className="mt-1 underline cursor-pointer">
							{shortenAddress(moduleAddress)}
							<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
						</div>
					</Link>
				</AppBox> */}
			</div>
		</AppCard>
	);
}
