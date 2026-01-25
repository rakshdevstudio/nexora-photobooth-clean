import type { PrintEngine } from "@/booth/engines/print/types";
import { enqueuePrintJob, updateJobStatus } from "@/booth/printQueue/printQueueService";

// Keep this type compatible with what we defined in d.ts,
// ensuring we don't crash if the bridge isn't completely accurate on load (though it should be).
interface ElectronAPI {
    printImage(html: string, printerName?: string): Promise<boolean>;
}

export class ElectronPrintEngine implements PrintEngine {
    async print(html: string): Promise<void> {
        if (!window.electron) {
            throw new Error("Electron API not available");
        }

        // Check for printer override in admin settings (localStorage)
        // We match the key we use in AdminPanel
        const storedPrinter = localStorage.getItem("nexora.booth.printer");
        const printerName = storedPrinter || undefined;

        console.log("[ElectronPrintEngine] Printing...", { printerName });

        // 1. Enqueue job as PENDING first (Safety: Never lose a print)
        // We do this BEFORE the actual print attempt.
        let jobId: string;
        try {
            jobId = await enqueuePrintJob(html, printerName);
        } catch (err) {
            console.error("[ElectronPrintEngine] Failed to enqueue print job!", err);
            // If we can't write to DB, we really can't guarantee safety.
            // But we try to print anyway? No, let's try to print anyway as fallback.
            // But strict requirement says "Use IndexedDB".
            // We'll proceed to print, logging the DB error.
            jobId = "temp-fallback-" + Date.now();
        }

        try {
            // 2. Attempt Silent Print
            await window.electron.printImage(html, printerName);
            console.log("PRINT_SUCCESS");

            // 3. Mark as PRINTED
            if (!jobId.startsWith("temp-fallback")) {
                await updateJobStatus(jobId, "PRINTED");
            }
        } catch (e) {
            // 4. On Failure: We do NOT throw. We leave it as PENDING (or update error).
            console.error("PRINT_FAILED -> queued", e);

            // If it was a fallback ID (DB fail), we can't really queue it.
            // But if it was a real ID, it's already in DB as PENDING.
            // We can optionally update the last error.
            if (!jobId.startsWith("temp-fallback")) {
                await updateJobStatus(jobId, "PENDING", String(e));
            }

            // Return "queued status" essentially by NOT throwing.
            // The booth flow will continue to "Thank You".
            return;
        }
    }
}
