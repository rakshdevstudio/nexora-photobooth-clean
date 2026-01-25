import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { DeviceService } from './device.service';
import { PrintService } from './print.service';

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Fullscreen for kiosk by default, but windowed for dev
        fullscreen: process.env.NODE_ENV === 'production',
    });

    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:8080');
        win.webContents.openDevTools();
    } else {
        // Basic assumption for now - adjust if dist location differs
        win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
}

app.whenReady().then(() => {
    ipcMain.handle('get-mac-address', () => {
        return DeviceService.getMacAddress();
    });

    const printService = new PrintService();
    ipcMain.handle('print-image', async (_, html: string, printerName?: string) => {
        const win = BrowserWindow.getAllWindows()[0]; // Use main window for reference if needed, though service creates its own
        return printService.printImage(html, printerName);
    });

    ipcMain.handle('get-printers', async (event) => {
        // We need a BrowserWindow instance to call getPrintersAsync (or simple getPrinters from contents)
        // We can use the sender window
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return [];
        return printService.getPrinters(win);
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
