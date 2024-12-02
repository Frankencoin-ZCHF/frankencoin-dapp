import React, { createContext, useEffect, useState } from 'react';
import { DEFAULT_FRONTEND_CODE, FRONTEND_CODES, MARKETING_PARAM_NAME } from '@utils';
import { useRouter } from 'next/router';

interface FrontendCodeContextType {
    marketingCode: string;
    frontendCode: `0x${string}`;
}

export const FrontendCodeContext = createContext<FrontendCodeContextType | undefined>(undefined);

export const FrontendCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [marketingCode, setMarketingCode] = useState('');
    const [frontendCode, setFrontendCode] = useState<`0x${string}`>(DEFAULT_FRONTEND_CODE);
    const router = useRouter();

    useEffect(() => {
        const { [MARKETING_PARAM_NAME]: marketingParam } = router.query;

        if (FRONTEND_CODES[marketingParam as string ?? '']) {
            setMarketingCode(marketingParam as string ?? '');
            setFrontendCode(FRONTEND_CODES[marketingParam as string] ?? DEFAULT_FRONTEND_CODE);
        }
    }, [router.isReady]);

    return (
        <FrontendCodeContext.Provider value={{ marketingCode, frontendCode }}>
            {children}
        </FrontendCodeContext.Provider>
    );
};
