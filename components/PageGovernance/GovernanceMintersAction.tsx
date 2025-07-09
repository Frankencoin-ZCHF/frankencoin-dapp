import { MinterQuery } from "@frankencoin/api";
import { useState } from "react";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { shortenAddress } from "@utils";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { useAccount } from "wagmi";
import Button from "@components/Button";
import { Address, Chain } from "viem";
import {
	ADDRESS,
	ChainId,
	ChainIdMain,
	ChainIdSide,
	EquityABI,
	FrankencoinABI,
	SupportedChains,
	SupportedChainsMap,
} from "@frankencoin/zchf";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";

interface Props {
	minter: MinterQuery;
	disabled: boolean;
}

export default function GovernanceMintersAction({ minter, disabled }: Props) {
	const [isVetoing, setVetoing] = useState<boolean>(false);
	const account = useAccount();
	const chainId = minter.chainId as ChainId;
	const [isHidden, setHidden] = useState<boolean>(false);

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		const m = minter.minter;
		const h = [] as Address[];
		const msg = "No";

		try {
			setVetoing(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address:
					chainId == 1 ? ADDRESS[chainId as ChainIdMain].frankencoin : ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
				chainId: chainId,
				abi: FrankencoinABI,
				functionName: "denyMinter",
				args: [m, h, msg],
			});

			const toastContent = [
				{
					title: `Veto minter: `,
					value: shortenAddress(m),
				},
				{
					title: `Deny Message: `,
					value: msg,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Vetoing minter...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully vetoed minter" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setVetoing(false);
		}
	};

	return (
		<div className="">
			<GuardSupportedChain disabled={isHidden || disabled} chain={SupportedChainsMap[chainId] as Chain}>
				<Button className="h-10" disabled={isHidden || disabled} isLoading={isVetoing} onClick={(e) => handleOnClick(e)}>
					Veto
				</Button>
			</GuardSupportedChain>
		</div>
	);
}
