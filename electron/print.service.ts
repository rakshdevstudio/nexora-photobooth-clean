import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

export class PrintService {
    async getPrinters(window: BrowserWindow) {
        return window.webContents.getPrintersAsync();
    }

    async printImage(htmlContent: string, printerName?: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Create a hidden window for printing
            const options: BrowserWindowConstructorOptions = {
                show: false,
                width: 1200, // Standard strip width roughly
                height: 1800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                },
            };

            const printWindow = new BrowserWindow(options);

            // Clean up window after print or error
            const cleanup = () => {
                if (!printWindow.isDestroyed()) {
                    printWindow.close();
                }
            };

            printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

            printWindow.webContents.on('did-finish-load', () => {
                printWindow.webContents.print(
                    {
                        silent: true,
                        printBackground: true,
                        deviceName: printerName || undefined,
                    },
                    (success, errorType) => {
                        if (!success) {
                            console.error(`[PrintService] Failed: ${errorType}`);
                            reject(new Error(errorType));
                        } else {
                            resolve(true);
                        }
                        cleanup();
                    }
                );
            });

            printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                console.error(`[PrintService] Failed to load content: ${errorDescription}`);
                reject(new Error(`Failed to load content: ${errorDescription}`));
                cleanup();
            });
        });
    }
}
