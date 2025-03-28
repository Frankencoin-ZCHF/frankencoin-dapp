import React, { createContext, useEffect, useState } from "react";
import { DEFAULT_FRONTEND_CODE, getFrontendCodeFromReferralName, MARKETING_PARAM_NAME } from "@utils";
import { useRouter } from "next/router";
import { FrontendGatewayABI } from "@deuro/eurocoin";
import { zeroAddress } from "viem";
import { ADDRESS } from "@deuro/eurocoin";
import { readContract } from "wagmi/actions";
import { WAGMI_CONFIG } from "../app.config";
import { useChainId } from "wagmi";

interface FrontendCodeContextType {
    marketingCode: string;
    frontendCode: `0x${string}`;
}

export const FrontendCodeContext = createContext<FrontendCodeContextType | undefined>(undefined);

export const FrontendCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [marketingCode, setMarketingCode] = useState("");
    const [frontendCode, setFrontendCode] = useState<`0x${string}`>(DEFAULT_FRONTEND_CODE);
    const router = useRouter();
    const chainId = useChainId();

    useEffect(() => {
        const fetchReferralCode = async () => {
            if (!router.isReady) return;
            const marketingParam = router.query[MARKETING_PARAM_NAME] as string | undefined;

            if (!marketingParam) {
                setMarketingCode("");
                setFrontendCode(DEFAULT_FRONTEND_CODE);
                return;
            }

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
                } else {
                    setMarketingCode("");
                    setFrontendCode(DEFAULT_FRONTEND_CODE);
                }
            } catch (error) {
                setMarketingCode("");
                setFrontendCode(DEFAULT_FRONTEND_CODE);
            }
        };

        fetchReferralCode();
    }, [router.isReady, router.query, chainId]);

    return <FrontendCodeContext.Provider value={{ marketingCode, frontendCode }}>{children}</FrontendCodeContext.Provider>;
};
