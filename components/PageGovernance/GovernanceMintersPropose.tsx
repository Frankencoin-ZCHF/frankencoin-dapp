import { shortenAddress } from "../../utils/format";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import Button from "@components/Button";
import NormalInput from "@components/Input/NormalInput";
import AppCard from "@components/AppCard";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { CONFIG, WAGMI_CHAINS, WAGMI_CONFIG } from "../../app.config";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ADDRESS, ChainId, ChainIdMain, ChainIdSide, EquityABI, FrankencoinABI } from "@frankencoin/zchf";
import { renderErrorTxToastDecode, TxToast } from "@components/TxToast";
import { toast } from "react-toastify";
import TokenInput from "@components/Input/TokenInput";
import AppLink from "@components/AppLink";
import AddressInput from "@components/Input/AddressInput";
import { Address, isAddress, parseEther, parseUnits } from "viem";
import { useUserBalance } from "@hooks";
import { SOCIAL } from "@utils";
import { mainnet } from "viem/chains";
import GuardSupportedChain from "@components/Guards/GuardSupportedChain";
import { AppKitNetwork } from "@reown/appkit/networks";

interface Props {}

export default function GovernanceMintersPropose({}: Props) {
	const userBal = useUserBalance();
	const [isHandling, setHandling] = useState<boolean>(false);
	const account = useAccount();
	const chainId = useChainId();
	const [period, setPeriod] = useState<string>("14");
	const [module, setModule] = useState<string>("");
	const [comment, setComment] = useState<string>("");
	const [isHidden, setHidden] = useState<boolean>(false);
	const [isDisabled, setDisabled] = useState<boolean>(true);
	const [errorAddress, setErrorAddress] = useState<string>("");

	const chain = WAGMI_CHAINS.find((c) => c.id == chainId) as AppKitNetwork;

	useEffect(() => {
		if (
			Number(period) < 14 || chainId == mainnet.id
				? userBal[chainId as ChainIdMain].frankencoin
				: userBal[chainId as ChainIdSide].frankencoin < parseEther("1000") || !isAddress(module) || comment.length == 0
		)
			setDisabled(true);
		else setDisabled(false);
	}, [period, module, comment, userBal, chainId]);

	const changeAddress = (value: string) => {
		setModule(value);
		if (isAddress(value)) setErrorAddress("");
		else setErrorAddress("Not valid address");
	};

	const handleOnClick = async function (e: any) {
		e.preventDefault();
		if (!account.address) return;

		try {
			setHandling(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address:
					chainId == mainnet.id
						? ADDRESS[chainId as ChainIdMain].frankencoin
						: ADDRESS[chainId as ChainIdSide].ccipBridgedFrankencoin,
				chainId: chainId,
				abi: FrankencoinABI,
				functionName: "suggestMinter",
				args: [module as Address, BigInt(period) * BigInt(60 * 60 * 24), parseUnits("1000", 18), comment],
			});

			const toastContent = [
				{
					title: `Module: `,
					value: shortenAddress(module as Address),
				},
				{
					title: `Comment: `,
					value: comment,
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Proposing new module...`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully proposed" rows={toastContent} />,
				},
			});

			setHidden(true);
		} catch (error) {
			toast.error(renderErrorTxToastDecode(error, EquityABI));
		} finally {
			setHandling(false);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
			<AppCard>
				<div className="mt-4 text-lg font-bold text-center">Proposal Process</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					<TokenInput
						label="Proposal Fee"
						symbol="ZCHF"
						value={"1000"}
						onChange={() => {}}
						digit={0}
						error={
							account.address != undefined && userBal[chainId as ChainId].frankencoin < BigInt(1000 * 1e18)
								? "Not enough ZCHF"
								: ""
						}
						disabled={true}
						placeholder="Amount"
					/>
					<NormalInput
						label="Proposal Period"
						symbol="days"
						digit={0}
						value={period}
						onChange={(e) => setPeriod(e)}
						error={Number(period) < 14 ? "Proposal Period must be at least 14 days." : ""}
						placeholder="Number"
					/>
				</div>
				<div className="text-text-secondary">
					It is recommended to{" "}
					<AppLink
						label="discuss"
						href="https://github.com/Frankencoin-ZCHF/FrankenCoin/discussions"
						external={true}
						className=""
					/>{" "}
					the new module and share your thought with the{" "}
					<AppLink label="community" href={SOCIAL.Telegram} external={true} className="" /> before proposing it to increase the
					probability of passing the decentralized governance process.
				</div>
			</AppCard>

			<AppCard>
				<div className="flex flex-col gap-4">
					<div className="mt-4 text-lg font-bold text-center">Propose a new Module</div>

					<AddressInput
						label="Address"
						placeholder="Enter the address here"
						value={module}
						onChange={changeAddress}
						error={errorAddress}
					/>

					<AddressInput label="Comment" placeholder={`Enter the comment here`} value={comment} onChange={setComment} />

					<GuardSupportedChain disabled={isDisabled || isHidden} chain={chain}>
						<Button
							className="max-md:h-10 md:h-12"
							disabled={isDisabled || isHidden}
							isLoading={isHandling}
							onClick={(e) => handleOnClick(e)}
						>
							Propose Module
						</Button>
					</GuardSupportedChain>
				</div>
			</AppCard>
		</div>
	);
}
