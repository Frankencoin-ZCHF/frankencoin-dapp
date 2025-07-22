import AppCard from "@components/AppCard";
import { Address, formatUnits, zeroAddress } from "viem";
import AppLink from "@components/AppLink";
import { useAccount } from "wagmi";
import { ContractUrl, shortenAddress } from "@utils";
import { SupportedChain } from "@frankencoin/zchf";

interface Props {
	senderAddress: Address | undefined;
	recipientAddress: Address | undefined;
	chain: SupportedChain | undefined;
	recipientChain: SupportedChain | undefined;
	ccipFee: bigint;
}

export default function TransferDetailsCard({ senderAddress, recipientAddress, chain, recipientChain, ccipFee }: Props) {
	const { address } = useAccount();
	const isSameChain = recipientChain?.id == chain?.id;

	return (
		<AppCard>
			<div className="md:mt-4 text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Sender</div>
					<AppLink
						className=""
						label={shortenAddress(senderAddress || zeroAddress)}
						href={ContractUrl(senderAddress || zeroAddress, chain)}
						external={true}
					/>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">From</div>
					<div className="">{chain?.name}</div>
				</div>

				<div className="md:mt-4 text-lg font-bold text-center"></div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">Recipient</div>
					<AppLink
						className=""
						label={shortenAddress(recipientAddress || zeroAddress)}
						href={ContractUrl(recipientAddress || zeroAddress, recipientChain)}
						external={true}
					/>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">To</div>
					<div className="">{recipientChain?.name}</div>
				</div>
			</div>

			<div className="md:mt-8 text-lg font-bold text-center">CCIP Details</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Bridging ZCHF</div>
					<div className="">{isSameChain ? "False" : "True"}</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Fee</div>
					<div className="">
						{Math.round(Number(formatUnits(ccipFee, 18)) * 100000000) / 100000000} {chain?.nativeCurrency.symbol}
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
