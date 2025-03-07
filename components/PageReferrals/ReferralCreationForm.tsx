import { useState, useCallback, useRef, useEffect } from "react";
import Button from "@components/Button";
import { TextInputOutlined } from "@components/Input/TextInputOutlined";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import { zeroAddress } from "viem";
import { ADDRESS, FrontendGatewayABI } from "@deuro/eurocoin";
import { useChainId } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../../app.config";
import { toast } from "react-toastify";
import { TxToast } from "@components/TxToast";
import { getFrontendCodeFromReferralName } from "@utils";
import { useMyReferrals } from "@hooks";

export const CopyLinkButton = ({ text, contentOnCopy }: { text: string; contentOnCopy: string }) => {
	const [isCopied, setIsCopied] = useState(false);

	const copyReferralLink = () => {
		navigator.clipboard.writeText(text.trim());
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<div className="flex w-full sm:w-[80%] min-w-fit">
			<Button
				onClick={copyReferralLink}
				className={`!px-4 !py-2.5 ${
					isCopied ? "bg-[#0d3e7c]" : "bg-borders-primary"
				} rounded-lg justify-between items-center inline-flex overflow-hidden`}
			>
				<span className="basis-0 text-white text-sm sm:text-base font-extrabold leading-normal">
					{isCopied ? contentOnCopy : text}
				</span>
				<span>
					<FontAwesomeIcon
						icon={isCopied ? faCheck : faCopy}
						className="w-4 h-4 sm:w-5 sm:h-5 relative text-white overflow-hidden"
					/>
				</span>
			</Button>
		</div>
	);
};

export const ReferralCreationForm = () => {
	const { myReferralLink, setMyReferralName } = useMyReferrals();
	const [name, setName] = useState("");
	const [isNameAvailable, setIsNameAvailable] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const chainId = useChainId();
	const { t } = useTranslation();
	const timer = useRef<NodeJS.Timeout | null>(null);

	const handleReferralNameChange = useCallback(
		async (value: string) => {
			setName(value);

			if (timer.current) clearTimeout(timer.current);
			if (!value) return;

			timer.current = setTimeout(async () => {
				try {
					const frontendCode = getFrontendCodeFromReferralName(value);
					const [, owner] = await readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].frontendGateway,
						abi: FrontendGatewayABI,
						functionName: "frontendCodes",
						args: [frontendCode],
					});

					setIsNameAvailable(owner === zeroAddress);
				} catch (error) {
					console.error(error);
				}
			}, 500);
		},
		[chainId]
	);

	const createReferralLink = async () => {
		try {
			setIsLoading(true);

			const frontendCode = getFrontendCodeFromReferralName(name);
			const [, owner] = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "frontendCodes",
				args: [frontendCode],
			});

			if (owner !== zeroAddress) {
				setIsNameAvailable(false);
				throw new Error("Referral name already taken");
			}

			const registerWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].frontendGateway,
				abi: FrontendGatewayABI,
				functionName: "registerFrontendCode",
				args: [frontendCode],
			});

			const toastContent = [
				{
					title: t("referrals.txs.referral_code"),
					value: name,
				},
				{
					title: t("common.txs.transaction"),
					hash: registerWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: registerWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={t("referrals.txs.registering_referral_code")} rows={toastContent} />,
				},
				success: {
					render: <TxToast title={t("referrals.txs.referral_code_registered")} rows={toastContent} />,
				},
			});

			setMyReferralName(name);
			setName("");
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{myReferralLink ? (
				<CopyLinkButton text={myReferralLink} contentOnCopy={t("referrals.copied_let_s_go")} />
			) : (
				<>
					<TextInputOutlined
						className="h-11 grow max-w-80"
						placeholder={t("referrals.type_your_desired_ref_name")}
						value={name}
						onChange={handleReferralNameChange}
					/>
					<Button
						onClick={createReferralLink}
						disabled={!name || !isNameAvailable}
						className="h-10 sm:h-11 !w-fit text-sm sm:text-base"
						isLoading={isLoading}
					>
						{t("referrals.create")}
					</Button>
				</>
			)}
		</>
	);
};
