import { DeviceService } from './DeviceService';

export type LicenseState = 'UNLICENSED' | 'ACTIVATING' | 'ACTIVE' | 'LOCKED';

interface LicenseData {
    key: string;
    deviceId: string;
    lastValidated: string; // ISO Date
}

const STORAGE_KEY = 'kiosk_license_data';

export const LicenseService = {
    // 1. Device ID Management
    getDeviceId: async (): Promise<string> => {
        return DeviceService.getDeviceId();
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

    // 3. Validation Logic (Strict - No Grace Period)
    validateWithServer: async (licenseKey: string, deviceId: string): Promise<boolean> => {
        const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
        const res = await fetch(`${API_URL}/licenses/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey, deviceId })
        });

        if (!res.ok) {
            return false; // All failures are hard failures
        }

        const data = await res.json();
        return data.valid;
    }
};
