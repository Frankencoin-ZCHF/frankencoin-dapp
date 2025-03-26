import React, { createContext, useEffect, useState } from 'react';
import { DEFAULT_FRONTEND_CODE, FRONTEND_CODES, getFrontendCodeFromReferralName, MARKETING_PARAM_NAME } from '@utils';
import { useRouter } from 'next/router';
import { FrontendGatewayABI } from '@deuro/eurocoin';
import { stringToHex, zeroAddress } from 'viem';
import { ADDRESS } from '@deuro/eurocoin';
import { pad } from 'viem';
import { readContract } from 'wagmi/actions';
import { WAGMI_CONFIG } from '../app.config';
import { useChainId } from 'wagmi';

interface FrontendCodeContextType {
    marketingCode: string;
    frontendCode: `0x${string}`;
}

export const FrontendCodeContext = createContext<FrontendCodeContextType | undefined>(undefined);

export const FrontendCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [marketingCode, setMarketingCode] = useState('');
    const [frontendCode, setFrontendCode] = useState<`0x${string}`>(DEFAULT_FRONTEND_CODE);
    const router = useRouter();
    const chainId = useChainId();
    
    useEffect(() => {
        const fetchReferralCode = async () => {            
            const { [MARKETING_PARAM_NAME]: marketingParam } = router.query;
            
            if (FRONTEND_CODES[marketingParam as string ?? '']) {
                setMarketingCode(marketingParam as string ?? '');
                setFrontendCode(FRONTEND_CODES[marketingParam as string] ?? DEFAULT_FRONTEND_CODE);

            } else if (marketingParam) {
                const code = getFrontendCodeFromReferralName(marketingParam as string);
                const [, owner] = await readContract(WAGMI_CONFIG, {
                    address: ADDRESS[chainId].frontendGateway,
                    abi: FrontendGatewayABI,
                    functionName: "frontendCodes",
                    args: [code],
                });

                const hasOwner = owner !== zeroAddress;
                setMarketingCode(hasOwner ? marketingParam as string : '');
                setFrontendCode(hasOwner ? code : DEFAULT_FRONTEND_CODE);
            }
        }

        fetchReferralCode();
    }, [router.isReady]);

    return (
        <FrontendCodeContext.Provider value={{ marketingCode, frontendCode }}>
            {children}
        </FrontendCodeContext.Provider>
    );
};
