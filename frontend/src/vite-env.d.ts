/// <reference types="vite/client" />

interface Window {
    electron?: {
        getMacAddress: () => Promise<string>;
        printImage(html: string, printerName?: string): Promise<boolean>;
        getPrinters(): Promise<Electron.PrinterInfo[]>;
    };
}
