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
    const [state, setState] = useState<LicenseState>('ACTIVATING'); // Start with validating

    // Core Validation Loop
    const validate = async () => {
        const stored = LicenseService.getStoredLicense();
        if (!stored) {
            setState('UNLICENSED');
            return;
        }

        try {
            // Check Server
            const isValid = await LicenseService.validateWithServer(stored.key, stored.fingerprint);

            if (isValid) {
                // Update local timestamp
                LicenseService.saveLicense({ ...stored, lastValidated: new Date().toISOString() });
                setState('ACTIVE');
            } else {
                setState('LOCKED');
            }
        } catch (e) {
            // Offline Grace Check
            if (LicenseService.isWithinGracePeriod(stored.lastValidated)) {
                setState('ACTIVE'); // Grace mode
            } else {
                setState('LOCKED'); // Grace expired
            }
        }
    };

    useEffect(() => {
        validate();
        // Optional: Periodic revalidation can be added here
    }, []);

    const handleActivationSuccess = () => {
        validate(); // Re-run validation to transition state
    };

    if (state === 'ACTIVATING' && !LicenseService.getStoredLicense()) {
        // Tiny optimization: if no local license, strictly Unlicensed immediately
        // But sticking to logic: useEffect will catch it fast.
        // Showing nothing or splash while booting
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    // Intercept View
    if (state === 'UNLICENSED') {
        return <ActivationScreen onSuccess={handleActivationSuccess} />;
    }

    if (state === 'LOCKED') {
        return <LockedScreen onRetry={validate} />;
    }

    // State is ACTIVATING (with stored license) or ACTIVE
    // If ACTIVATING but we have stored license, we might want to show a spinner or just let the app load underneath?
    // Better to block until confirmed ACTIVE for security, preventing flashes of UI.
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
