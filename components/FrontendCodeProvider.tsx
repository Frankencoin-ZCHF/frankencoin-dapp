import React, { createContext, useEffect, useState } from "react";
import {
	DEFAULT_FRONTEND_CODE,
	getFrontendCodeFromReferralName,
	getReferralNameFromFrontendCode,
	MARKETING_PARAM_NAME,
	ZERO_FRONTEND_CODE,
} from "@utils";
import { useRouter } from "next/router";
import { FrontendGatewayABI } from "@deuro/eurocoin";
import { zeroAddress } from "viem";
import { ADDRESS } from "@deuro/eurocoin";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../app.config";
import { useAccount, useChainId } from "wagmi";

interface FrontendCodeContextType {
	marketingCode: string;
	frontendCode: `0x${string}`;
}

export const FrontendCodeContext = createContext<FrontendCodeContextType | undefined>(undefined);

export const FrontendCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [marketingCode, setMarketingCode] = useState("");
	const [frontendCode, setFrontendCode] = useState<`0x${string}`>(ZERO_FRONTEND_CODE);
	const router = useRouter();
	const chainId = useChainId();
	const { address } = useAccount();

	useEffect(() => {
		const fetchReferralCode = async () => {
			if (!router.isReady) return;
			const marketingParam = router.query[MARKETING_PARAM_NAME] as string | undefined;

			if (marketingParam) {
				try {
					const code = getFrontendCodeFromReferralName(marketingParam);
					const [, owner] = await readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].frontendGateway,
						abi: FrontendGatewayABI,
						functionName: "frontendCodes",
						args: [code],
					});

					const hasOwner = owner !== zeroAddress;
					if (hasOwner) {
						setMarketingCode(marketingParam);
						setFrontendCode(code);
						return;
					}
				} catch (error) {
					console.error("Error checking marketing parameter:", error);
				}
			} else if (address) {
				try {
					const lastUsedCode = await readContract(WAGMI_CONFIG, {
						address: ADDRESS[chainId].frontendGateway,
						abi: FrontendGatewayABI,
						functionName: "lastUsedFrontendCode",
						args: [address],
					});

					if (lastUsedCode === ZERO_FRONTEND_CODE) {
						setFrontendCode(DEFAULT_FRONTEND_CODE);
						setMarketingCode("");
						return;
					} else {
						setFrontendCode(lastUsedCode);
						setMarketingCode(getReferralNameFromFrontendCode(lastUsedCode));
						return;
					}
				} catch (error) {
					console.error("Error checking lastUsedFrontendCode:", error);
				}
			} else {
				setFrontendCode(DEFAULT_FRONTEND_CODE);
				setMarketingCode("");
			}
		};

		fetchReferralCode();
	}, [router.isReady, router.query, chainId, address]);

	return <FrontendCodeContext.Provider value={{ marketingCode, frontendCode }}>{children}</FrontendCodeContext.Provider>;
};
