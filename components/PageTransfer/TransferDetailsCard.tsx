import AppCard from "@components/AppCard";
import { AppKitNetwork } from "@reown/appkit/networks";
import { formatCurrency } from "@utils";
import { formatUnits } from "viem";
import { WAGMI_CHAINS } from "../../app.config";
import AppLink from "@components/AppLink";
import { useAccount } from "wagmi";

interface Props {
	chain: AppKitNetwork | undefined;
	recipientChainName: string;
	ccipFee: bigint;
}

export default function TransferDetailsCard({ chain, recipientChainName, ccipFee }: Props) {
	const { address } = useAccount();

	const targetChain = WAGMI_CHAINS.find((c) => c.name.toLowerCase() == recipientChainName.toLowerCase());
	if (!targetChain) throw new Error("targetChain not found");

	const isSameChain = targetChain.id == chain?.id;

	return (
		<AppCard>
			<div className="md:mt-4 text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Bridging ZCHF</div>
					<div className="">{isSameChain ? "False" : "True"}</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Fee</div>
					<div className="">
						{formatCurrency(formatUnits(ccipFee, 18))} {chain?.nativeCurrency.symbol}
					</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Explorer</div>
					<AppLink
						className=""
						label="Check Status"
						external={true}
						href={`https://ccip.chain.link${address ? `/address/${address}` : ""}`}
					/>
				</div>
			</div>
		</AppCard>
	);
}
