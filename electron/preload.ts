import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    getMacAddress: () => ipcRenderer.invoke('get-mac-address'),
    printImage: (html: string, printerName?: string) => ipcRenderer.invoke('print-image', html, printerName),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
});
