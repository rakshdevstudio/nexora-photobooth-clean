import { DeviceService } from './DeviceService';
import { toast } from 'sonner';

export type LicenseState = 'UNLICENSED' | 'ACTIVATING' | 'ACTIVE' | 'LOCKED';

interface LicenseData {
    key: string;
    fingerprint: string;
    lastValidated: string; // ISO Date
}

const STORAGE_KEY = 'kiosk_license_data';
const GRACE_PERIOD_HOURS = 24;

export const LicenseService = {
    // 1. Device Fingerprinting
    getDeviceFingerprint: async (): Promise<string> => {
        return DeviceService.getFingerprint();
    },

    // 2. Local Storage Management
    getStoredLicense: (): LicenseData | null => {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    saveLicense: (data: LicenseData) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    clearLicense: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    // 3. Validation Logic
    validateWithServer: async (licenseKey: string, fingerprint: string): Promise<boolean> => {
        try {
            const res = await fetch('/licenses/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey, deviceFingerprint: fingerprint })
            });

            if (!res.ok) {
                if (res.status === 403 || res.status === 404) return false; // Hard fail
                throw new Error('Network error'); // Soft fail
            }

            const data = await res.json();
            return data.valid;
        } catch (e) {
            throw e; // Let caller handle soft fails (offline)
        }
    },

    // 4. offline Grace Check
    isWithinGracePeriod: (lastValidated: string): boolean => {
        const last = new Date(lastValidated).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - last) / (1000 * 60 * 60);
        return hoursDiff < GRACE_PERIOD_HOURS;
    }
};
