import * as os from 'os';

export class DeviceService {
    static getMacAddress(): string {
        const interfaces = os.networkInterfaces();

        // Priority list of interface names to check first
        // en0: standard mac Wi-Fi/Ethernet
        // eth0: standard linux Ethernet
        // wlan0: standard linux Wi-Fi
        const priorityNames = ['en0', 'eth0', 'wlan0', 'Ethernet', 'Wi-Fi'];

        // Sort interfaces: priority ones first, then others
        const interfaceNames = Object.keys(interfaces).sort((a, b) => {
            const indexA = priorityNames.indexOf(a);
            const indexB = priorityNames.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        for (const name of interfaceNames) {
            const networkInterface = interfaces[name];
            if (!networkInterface) continue;

            for (const net of networkInterface) {
                // Skip internal (localhost) and IPv6 (usually)
                // We want a stable MAC. IPv4/IPv6 share MAC usually, but let's stick to the first valid one found.
                if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
                    return net.mac.toUpperCase();
                }
            }
        }

        // Fallback if absolutely nothing found (unlikely on physical device)
        return '00:00:00:00:00:00';
    }
}
