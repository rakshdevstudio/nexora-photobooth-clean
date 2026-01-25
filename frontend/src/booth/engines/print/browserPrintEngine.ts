import type { PrintEngine } from "@/booth/engines/print/types";

/** Browser fallback: opens a print window.
 * In Electron/Tauri: replace with native print APIs / silent print.
 */
export class BrowserPrintEngine implements PrintEngine {
  async print(html: string): Promise<void> {
    localStorage.setItem("nexora.temp.print.html", html);
    const w = window.open("/print-layout", "_blank", "noopener,noreferrer,width=800,height=600");
    if (!w) throw new Error("Popups blocked");
  }
}
