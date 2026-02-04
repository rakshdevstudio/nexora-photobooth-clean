import React, { createContext, useContext, useEffect, useState } from 'react';
import { LicenseService, LicenseState } from './LicenseService';
import ActivationScreen from './ActivationScreen';
import LockedScreen from './LockedScreen';
import { Loader2 } from 'lucide-react';

interface LicenseContextType {
    state: LicenseState;
    retryValidation: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export function LicenseProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<LicenseState>('ACTIVATING');

    // Core Validation Loop (Strict - No Grace Period)
    const validate = async () => {
        const stored = LicenseService.getStoredLicense();
        if (!stored) {
            setState('UNLICENSED');
            return;
        }

        try {
            const isValid = await LicenseService.validateWithServer(stored.key, stored.deviceId);
            if (isValid) {
                LicenseService.saveLicense({ ...stored, lastValidated: new Date().toISOString() });
                setState('ACTIVE');
            } else {
                setState('LOCKED');
            }
        } catch (e) {
            // Network error = locked (no grace period)
            setState('LOCKED');
        }
    };

    useEffect(() => {
        validate();
    }, []);

    const handleActivationSuccess = () => {
        validate();
    };

    if (state === 'ACTIVATING' && !LicenseService.getStoredLicense()) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (state === 'UNLICENSED') {
        return <ActivationScreen onSuccess={handleActivationSuccess} />;
    }

    if (state === 'LOCKED') {
        return <LockedScreen onRetry={validate} />;
    }

    if (state === 'ACTIVATING') {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <LicenseContext.Provider value={{ state, retryValidation: validate }}>
            {children}
        </LicenseContext.Provider>
    );
}

export const useLicense = () => useContext(LicenseContext);
