import type { PrintEngine } from "@/booth/engines/print/types";

/** Browser fallback: opens a print window.
 * In Electron/Tauri: replace with native print APIs / silent print.
 */
export class BrowserPrintEngine implements PrintEngine {
  async print(html: string): Promise<void> {
    const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=600");
    if (!w) throw new Error("Popups blocked");
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }
}
