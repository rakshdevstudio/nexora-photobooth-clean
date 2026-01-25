export class DeviceService {
    private static readonly STORAGE_KEY = 'kiosk_device_fingerprint';

    static async getFingerprint(): Promise<string> {
        // 1. Try Electron MAC Address
        if (window.electron) {
            try {
                const mac = await window.electron.getMacAddress();
                if (mac && mac !== '00:00:00:00:00:00') {
                    return mac;
                }
            } catch (error) {
                console.error('Failed to get MAC address from Electron:', error);
            }
        }

        // 2. Fallback: LocalStorage UUID (Browser Dev Mode or Electron Failure)
        let fingerprint = localStorage.getItem(this.STORAGE_KEY);
        if (!fingerprint) {
            // Use crypto.randomUUID if available (secure), otherwise fallback
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                fingerprint = crypto.randomUUID();
            } else {
                fingerprint = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            localStorage.setItem(this.STORAGE_KEY, fingerprint);
        }

        return fingerprint;
    }
}
