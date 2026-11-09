import AppCard from "@components/AppCard";
import { Address, formatUnits, isAddress, zeroAddress } from "viem";
import AppLink from "@components/AppLink";
import { mainnet } from "viem/chains";
import { ContractUrl, shortenAddress } from "@utils";
import { ADDRESS, ChainIdSide, SupportedChain } from "@frankencoin/zchf";
import { CCIPLaneCapacity, formatLaneState } from "../../hooks/useCCIPLaneCapacity";

interface Props {
	senderAddress: Address | undefined;
	recipientAddress: Address | undefined;
	chain: SupportedChain | undefined;
	recipientChain: SupportedChain | undefined;
	ccipFee: bigint;
	lane?: CCIPLaneCapacity;
}

export default function TransferDetailsCard({ senderAddress, recipientAddress, chain, recipientChain, ccipFee, lane }: Props) {
	const isSameChain = recipientChain?.id == chain?.id;

	// The CCIP message is sent by the contract the user calls (TransferReference on mainnet, BridgedFrankencoin
	// on sidechains), not by the user's wallet, so the explorer has to be filtered by that contract.
	const ccipSender: Address | undefined =
		chain == undefined
			? undefined
			: chain.id == mainnet.id
			? ADDRESS[mainnet.id].transferReference
			: ADDRESS[chain.id as ChainIdSide]?.ccipBridgedFrankencoin;
	const ccipExplorerUrl = `https://ccip.chain.link${ccipSender ? `/address/${ccipSender}` : ""}`;

	senderAddress = senderAddress || zeroAddress;
	recipientAddress = recipientAddress || zeroAddress;

	return (
		<AppCard>
			<div className="md:mt-4 text-lg font-bold text-center">Outcome</div>
			<div className="p-4 flex flex-col gap-2">
				<div className="flex">
					<div className="flex-1 text-text-secondary">Sender</div>
					<AppLink
						className=""
						label={isAddress(senderAddress) ? shortenAddress(senderAddress) : "Invalid Input"}
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
						label={isAddress(recipientAddress) ? shortenAddress(recipientAddress) : "Invalid Input"}
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

				{!isSameChain && lane && (
					<>
						<div className="flex">
							<div className="flex-1 text-text-secondary">Outgoing Lane</div>
							<div className="">{formatLaneState(lane.outbound)}</div>
						</div>

						<div className="flex">
							<div className="flex-1 text-text-secondary">Incoming Lane</div>
							<div className="">{formatLaneState(lane.inbound)}</div>
						</div>
					</>
				)}

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Fee</div>
					<div className="">
						{Math.round(Number(formatUnits(ccipFee, 18)) * 100000000) / 100000000} {chain?.nativeCurrency.symbol}
					</div>
				</div>

				<div className="flex">
					<div className="flex-1 text-text-secondary">CCIP Explorer</div>
					<AppLink className="" label="All Transfers" external={true} href={ccipExplorerUrl} />
				</div>
			</div>
		</AppCard>
	);
}
