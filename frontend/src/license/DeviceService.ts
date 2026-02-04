export class DeviceService {
    private static readonly STORAGE_KEY = 'kiosk_device_id';

    static async getDeviceId(): Promise<string> {
        // Use stable UUID from localStorage
        let deviceId = localStorage.getItem(this.STORAGE_KEY);
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem(this.STORAGE_KEY, deviceId);
        }
        return deviceId;
    }
}
