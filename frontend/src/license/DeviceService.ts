export class DeviceService {
    private static readonly STORAGE_KEY = 'kiosk_device_fingerprint';

    static getFingerprint(): string {
        let fingerprint = localStorage.getItem(this.STORAGE_KEY);

        if (!fingerprint) {
            // Use crypto.randomUUID if available, otherwise simple fallback
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                fingerprint = crypto.randomUUID();
            } else {
                fingerprint = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            localStorage.setItem(this.STORAGE_KEY, fingerprint);
        }

        return fingerprint;
    }
}
