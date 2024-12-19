import { useContext } from 'react';
import { FrontendCodeContext } from '@components/FrontendCodeProvider';

export const useFrontendCode = () => {
    const context = useContext(FrontendCodeContext);
    if (!context) {
        throw new Error('useFrontendCode must be used within a FrontendCodeProvider');
    }
    return context;
}; 